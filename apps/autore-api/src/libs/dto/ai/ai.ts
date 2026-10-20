import { Field, Int, ObjectType } from '@nestjs/graphql';
import { Car } from '../car/car';

// AI yordamchining javobi
@ObjectType()
export class AiAnswer {
	// AI yozgan qisqa matn
	@Field(() => String)
	reply: string;

	// bazadan topilgan mashinalar (AI o'ylab topmaydi — CarService.getCars natijasi)
	@Field(() => [Car])
	cars: Car[];

	// mos mashinalarning umumiy soni
	@Field(() => Int)
	total: number;

	// /car sahifasida "barchasini ko'rish" uchun CarsInquiry (JSON string); qidiruv bo'lmasa null
	@Field(() => String, { nullable: true })
	searchInput?: string;

	// keyingi tayyor savollar (chips)
	@Field(() => [String])
	chips: string[];

	// AI ishlamadi (kalit yo'q, limit tugadi, tarmoq xatosi) — frontend oddiy filtrlarni taklif qiladi
	@Field(() => Boolean)
	fallback: boolean;
}
