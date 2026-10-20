import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import type { ObjectId } from 'mongoose';
import { CarService } from '../car/car.service';
import { AiAskInput } from '../../libs/dto/ai/ai.input';
import { AiAnswer } from '../../libs/dto/ai/ai';
import { CarsInquiry } from '../../libs/dto/car/car.input';
import {
	CarBrand,
	CarCondition,
	CarFuelType,
	CarLocation,
	CarTransmission,
	CarType,
} from '../../libs/enums/car.enum';
import { Direction } from '../../libs/enums/common.enum';
import { availableOptions } from '../../libs/config';
import { T } from '../../libs/types/common';

/** AI SOZLAMALARI **/
const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models';
const DEFAULT_MODEL = 'gemini-3.5-flash-lite'; // bepul tarifdagi model; .env'da GEMINI_MODEL bilan almashtirsa bo'ladi
const DAILY_LIMIT = 30; // bitta member (yoki IP) kuniga nechta savol bera oladi
const RESULT_LIMIT = 6; // chatda nechta mashina ko'rsatiladi
const MAX_PRICE = 2_000_000_000; // GraphQL Int chegarasidan kichik
const AI_SORTS = ['carPrice', 'carYear', 'carMileage', 'createdAt', 'carRank'];

// AI ishlamagan holatlar uchun tayyor matnlar (en | kr | ru)
const TEXTS: T = {
	en: {
		noKey: 'The AI assistant is not available right now. Please use the filters on the Cars page.',
		limit: 'You have reached today’s AI question limit. Please try again tomorrow or use the filters.',
		error: 'The AI assistant is busy right now. Please try again in a moment or use the filters.',
		noResults: 'No matching cars were found. Try a higher budget or fewer conditions.',
		chips: ['SUV under ₩30M', 'Electric cars', 'Family car in Seoul'],
	},
	kr: {
		noKey: '지금은 AI 도우미를 사용할 수 없습니다. 차량 페이지의 필터를 이용해 주세요.',
		limit: '오늘 AI 질문 한도를 모두 사용했습니다. 내일 다시 시도하거나 필터를 이용해 주세요.',
		error: 'AI 도우미가 지금 바쁩니다. 잠시 후 다시 시도하거나 필터를 이용해 주세요.',
		noResults: '조건에 맞는 차량이 없습니다. 예산을 늘리거나 조건을 줄여 보세요.',
		chips: ['3천만원 이하 SUV', '전기차', '서울 가족용 차'],
	},
	ru: {
		noKey: 'AI-помощник сейчас недоступен. Пожалуйста, используйте фильтры на странице автомобилей.',
		limit: 'Вы исчерпали дневной лимит вопросов к AI. Попробуйте завтра или используйте фильтры.',
		error: 'AI-помощник сейчас занят. Попробуйте чуть позже или используйте фильтры.',
		noResults: 'Подходящих автомобилей не найдено. Попробуйте увеличить бюджет или убрать условия.',
		chips: ['SUV до ₩30 млн', 'Электромобили', 'Семейный авто в Сеуле'],
	},
};

const LANG_NAMES: T = { en: 'English', kr: 'Korean', ru: 'Russian' };

@Injectable()
export class AiService {
	private readonly logger = new Logger('AiService');
	private usage = new Map<string, { day: string; count: number }>(); // kunlik limit hisobi (xotirada)

	constructor(private readonly carService: CarService) {}

	/** ASOSIY: foydalanuvchi xabari → AI filtr → bazadan qidiruv **/
	public async ask(memberId: ObjectId, clientKey: string, input: AiAskInput): Promise<AiAnswer> {
		const lang = input.lang && TEXTS[input.lang] ? input.lang : 'en';
		const texts = TEXTS[lang];

		const apiKey = process.env.GEMINI_API_KEY;
		if (!apiKey) return this.fallback(texts.noKey, texts.chips);
		if (!this.consumeQuota(clientKey)) return this.fallback(texts.limit, texts.chips);

		// 1) AI'dan javob olish (faqat bitta so'rov)
		let parsed: T;
		try {
			parsed = await this.callGemini(apiKey, input, lang);
		} catch (err) {
			const status = err?.response?.status;
			this.logger.warn(`Gemini request failed: ${status ?? err?.message}`); // kalit hech qachon log qilinmaydi
			return this.fallback(status === 429 ? texts.limit : texts.error, texts.chips);
		}

		// 2) AI javobini tekshirish — faqat ruxsat etilgan qiymatlar qoladi
		const reply = this.cleanText(parsed?.reply, 600) || texts.error;
		const chips = this.cleanChips(parsed?.chips, texts.chips);
		const inquiry = this.buildInquiry(parsed);

		// qidiruv kerak bo'lmasa (salomlashish, umumiy savol) — faqat matn
		if (!inquiry) return { reply, cars: [], total: 0, searchInput: undefined, chips, fallback: false };

		// 3) Bazadan qidiruv — mavjud CarService orqali (AI mashina o'ylab topmaydi)
		try {
			const result = await this.carService.getCars(memberId, inquiry);
			const cars = result?.list ?? [];
			const total = result?.metaCounter?.[0]?.total ?? 0;
			return {
				reply: total ? reply : texts.noResults,
				cars,
				total,
				searchInput: this.toSearchInput(inquiry), // /car sahifasidagi "barchasini ko'rish" uchun
				chips,
				fallback: false,
			};
		} catch (err) {
			this.logger.warn(`Car search failed: ${err?.message}`);
			return this.fallback(texts.error, texts.chips);
		}
	}

	/** Gemini generateContent (REST, axios) **/
	private async callGemini(apiKey: string, input: AiAskInput, lang: string): Promise<T> {
		const model = process.env.GEMINI_MODEL || DEFAULT_MODEL;

		// oldingi xabarlar + yangi xabar (Gemini'da AI roli "model" deb ataladi)
		const contents = [
			...(input.history ?? []).map((item) => ({
				role: item.role === 'assistant' ? 'model' : 'user',
				parts: [{ text: item.text }],
			})),
			{ role: 'user', parts: [{ text: input.message }] },
		];

		const response = await axios.post(
			`${GEMINI_URL}/${model}:generateContent`,
			{
				systemInstruction: { parts: [{ text: this.systemPrompt(lang) }] },
				contents,
				generationConfig: {
					responseMimeType: 'application/json', // faqat JSON qaytarsin
					temperature: 0.2,
					maxOutputTokens: 800,
				},
			},
			{ headers: { 'x-goog-api-key': apiKey, 'Content-Type': 'application/json' }, timeout: 20000 },
		);

		// javob matni (thinking qismlari tashlab yuboriladi)
		const parts: T[] = response?.data?.candidates?.[0]?.content?.parts ?? [];
		const raw = parts
			.filter((part) => typeof part?.text === 'string' && !part?.thought)
			.map((part) => part.text)
			.join('');
		return this.parseJson(raw);
	}

	private systemPrompt(lang: string): string {
		const thisYear = new Date().getFullYear();
		return [
			'You are the car-shopping assistant of Autore, a used and new car marketplace in South Korea.',
			'Your only job: understand what car the user wants and turn it into search filters. The website searches its own database with your filters, so never invent specific cars, prices, dealers or listings.',
			`Always write "reply" and "chips" in ${LANG_NAMES[lang]}.`,
			'Prices are in Korean won (KRW). 1만원 = 10,000 KRW, 1천만원 = 10,000,000 KRW, 1억 = 100,000,000 KRW. "$" or "dollar" budgets: convert at about 1,400 KRW per USD.',
			`The current year is ${thisYear}. "new-ish" or "recent" means yearMin around ${thisYear - 3}.`,
			'Allowed values (use exactly these, uppercase):',
			`brands: ${Object.values(CarBrand).join(', ')}`,
			`types: ${Object.values(CarType).join(', ')}`,
			`fuels: ${Object.values(CarFuelType).join(', ')}`,
			`transmissions: ${Object.values(CarTransmission).join(', ')}`,
			`locations: ${Object.values(CarLocation).join(', ')}`,
			`conditions: ${Object.values(CarCondition).join(', ')}`,
			`options: ${availableOptions.join(', ')} (carCredit = installment/loan possible, carBarter = trade-in/exchange possible)`,
			`sort: ${AI_SORTS.join(', ')}; direction: ASC or DESC (cheapest = carPrice ASC, newest = carYear DESC, lowest mileage = carMileage ASC).`,
			'"keyword" is only for a specific model name (e.g. "Sonata", "K5", "Model 3"); otherwise null.',
			'If the user refines an earlier request (e.g. "cheaper", "only electric"), return the FULL combined filters for the whole conversation.',
			'If the message is a greeting, off-topic or not about finding a car, set intent to "chat", leave filters empty, and reply briefly, steering back to car search.',
			'"reply": 1-2 short sentences introducing the search (e.g. "Here are SUVs under ₩30M in Seoul."). Do not state how many cars were found.',
			'"chips": 2-4 very short follow-up suggestions the user could tap (max 30 characters each).',
			'Return ONLY a JSON object with this exact shape:',
			'{"intent":"search"|"chat","reply":string,"filters":{"brands":[],"types":[],"fuels":[],"transmissions":[],"locations":[],"conditions":[],"options":[],"priceMin":number|null,"priceMax":number|null,"yearMin":number|null,"yearMax":number|null,"mileageMax":number|null,"keyword":string|null},"sort":string|null,"direction":"ASC"|"DESC"|null,"chips":[string]}',
		].join('\n');
	}

	/** AI filtrlarini CarsInquiry'ga aylantirish (tekshiruv bilan) **/
	private buildInquiry(parsed: T): CarsInquiry | null {
		const filters: T = parsed?.filters ?? {};
		const search: T = {};

		const typeList = this.pickEnum(filters.types, CarType);
		const brandList = this.pickEnum(filters.brands, CarBrand);
		const fuelTypeList = this.pickEnum(filters.fuels, CarFuelType);
		const transmissionList = this.pickEnum(filters.transmissions, CarTransmission);
		const locationList = this.pickEnum(filters.locations, CarLocation);
		const conditionList = this.pickEnum(filters.conditions, CarCondition);
		const options = Array.isArray(filters.options)
			? [...new Set(filters.options.filter((ele: any) => availableOptions.includes(ele)))]
			: [];

		if (typeList.length) search.typeList = typeList;
		if (brandList.length) search.brandList = brandList;
		if (fuelTypeList.length) search.fuelTypeList = fuelTypeList;
		if (transmissionList.length) search.transmissionList = transmissionList;
		if (locationList.length) search.locationList = locationList;
		if (conditionList.length) search.conditionList = conditionList;
		if (options.length) search.options = options;

		const priceMin = this.toInt(filters.priceMin);
		const priceMax = this.toInt(filters.priceMax);
		if (priceMin !== null || priceMax !== null) {
			search.pricesRange = this.range(priceMin ?? 0, priceMax ?? MAX_PRICE);
		}

		const yearMin = this.toInt(filters.yearMin);
		const yearMax = this.toInt(filters.yearMax);
		if (yearMin !== null || yearMax !== null) {
			search.yearsRange = this.range(yearMin ?? 1950, yearMax ?? new Date().getFullYear() + 1);
		}

		const mileageMax = this.toInt(filters.mileageMax);
		if (mileageMax !== null) search.mileageRange = this.range(0, mileageMax);

		const keyword = this.cleanText(filters.keyword, 40);
		if (keyword) search.text = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // regex belgilarini xavfsiz qiladi

		const hasFilters = Object.keys(search).length > 0;
		if (parsed?.intent !== 'search' && !hasFilters) return null;

		const sort = AI_SORTS.includes(parsed?.sort) ? parsed.sort : undefined;
		const direction = parsed?.direction === 'ASC' ? Direction.ASC : Direction.DESC;

		return {
			page: 1,
			limit: RESULT_LIMIT,
			...(sort ? { sort, direction } : {}),
			search,
		} as CarsInquiry;
	}

	/** YORDAMCHI FUNKSIYALAR **/
	// /car?input=... uchun: frontend GraphQL'ga Direction'ni nomi bilan ("ASC" | "DESC") yuboradi, raqam bilan emas
	private toSearchInput(inquiry: CarsInquiry): string {
		const { direction, ...rest } = inquiry;
		const payload: T = { ...rest, limit: 9 }; // /car sahifasining odatiy limiti
		if (direction !== undefined) payload.direction = direction === Direction.ASC ? 'ASC' : 'DESC';
		return JSON.stringify(payload);
	}

	private pickEnum(values: any, enumObj: T): any[] {
		if (!Array.isArray(values)) return [];
		const allowed = Object.values(enumObj);
		return [...new Set(values.map((ele) => String(ele).toUpperCase()).filter((ele) => allowed.includes(ele)))];
	}

	private toInt(value: any): number | null {
		if (value === null || value === undefined || value === '') return null;
		const num = Number(value);
		return Number.isFinite(num) && num >= 0 ? Math.min(Math.round(num), MAX_PRICE) : null; // GraphQL Int chegarasidan oshmasin
	}

	private range(start: number, end: number): { start: number; end: number } {
		return start <= end ? { start, end } : { start: end, end: start };
	}

	private cleanText(value: any, max: number): string {
		return typeof value === 'string' ? value.trim().slice(0, max) : '';
	}

	private cleanChips(value: any, defaults: string[]): string[] {
		if (!Array.isArray(value)) return defaults;
		const chips = value
			.map((ele) => this.cleanText(ele, 40))
			.filter(Boolean)
			.slice(0, 4);
		return chips.length ? chips : defaults;
	}

	// AI ba'zan JSON'ni ```json ... ``` ichiga o'raydi — shuni tozalaydi
	private parseJson(raw: string): T {
		const start = raw.indexOf('{');
		const end = raw.lastIndexOf('}');
		if (start === -1 || end <= start) throw new Error('AI returned no JSON');
		return JSON.parse(raw.slice(start, end + 1));
	}

	// kunlik limit: true = ruxsat, false = limit tugagan
	private consumeQuota(clientKey: string): boolean {
		const today = new Date().toISOString().slice(0, 10);
		if (this.usage.size > 5000) {
			for (const [key, value] of this.usage) if (value.day !== today) this.usage.delete(key); // eski kunlarni tozalaydi
		}
		const current = this.usage.get(clientKey);
		if (!current || current.day !== today) {
			this.usage.set(clientKey, { day: today, count: 1 });
			return true;
		}
		if (current.count >= DAILY_LIMIT) return false;
		current.count++;
		return true;
	}

	private fallback(reply: string, chips: string[]): AiAnswer {
		return { reply, cars: [], total: 0, searchInput: undefined, chips, fallback: true };
	}
}
