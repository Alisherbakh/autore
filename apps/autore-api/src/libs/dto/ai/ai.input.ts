import { Field, InputType } from '@nestjs/graphql';
import { ArrayMaxSize, IsIn, IsNotEmpty, IsOptional, Length, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

// AI yordamchi qo'llab-quvvatlaydigan tillar (next-i18next locale'lari bilan bir xil)
export const availableAiLangs = ['en', 'kr', 'ru'];
export const availableAiRoles = ['user', 'assistant'];

// chat tarixidagi bitta xabar (AI kontekstni eslab qolishi uchun)
@InputType()
export class AiHistoryItem {
	@IsNotEmpty()
	@IsIn(availableAiRoles)
	@Field(() => String)
	role: string;

	@IsNotEmpty()
	@Length(1, 600)
	@Field(() => String)
	text: string;
}

@InputType()
export class AiAskInput {
	// foydalanuvchining yangi xabari
	@IsNotEmpty()
	@Length(1, 500)
	@Field(() => String)
	message: string;

	// oldingi xabarlar (eng ko'pi 8 ta) — AI suhbatni davom ettira olishi uchun
	@IsOptional()
	@ArrayMaxSize(8)
	@ValidateNested({ each: true })
	@Type(() => AiHistoryItem)
	@Field(() => [AiHistoryItem], { nullable: true })
	history?: AiHistoryItem[];

	// javob tili: en | kr | ru
	@IsOptional()
	@IsIn(availableAiLangs)
	@Field(() => String, { nullable: true })
	lang?: string;
}
