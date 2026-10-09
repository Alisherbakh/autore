import { Field, InputType, Int } from '@nestjs/graphql';
import { IsNotEmpty, IsOptional, Length, Min } from 'class-validator';
import { ObjectId } from 'mongoose';
import { NoticeCategory, NoticeStatus } from '../../enums/notice.enum';

// admin yangi Notice yoki FAQ yaratadi
@InputType()
export class NoticeInput {
	@IsNotEmpty()
	@Field(() => NoticeCategory)
	noticeCategory: NoticeCategory;

	@IsOptional()
	@Field(() => NoticeStatus, { nullable: true })
	noticeStatus?: NoticeStatus;

	@IsNotEmpty()
	@Length(3, 100)
	@Field(() => String)
	noticeTitle: string;

	@IsNotEmpty()
	@Length(3, 2000)
	@Field(() => String)
	noticeContent: string;

	memberId?: ObjectId;
}

@InputType()
class NISearch {
	@IsNotEmpty()
	@Field(() => NoticeCategory)
	noticeCategory: NoticeCategory;

	// faqat admin uchun: public so'rovda doim ACTIVE ishlatiladi
	@IsOptional()
	@Field(() => NoticeStatus, { nullable: true })
	noticeStatus?: NoticeStatus;

	@IsOptional()
	@Field(() => String, { nullable: true })
	text?: string;
}

// ro'yxat so'rovi (public va admin bir xil shaklda), doim eng yangisi birinchi
@InputType()
export class NoticesInquiry {
	@IsNotEmpty()
	@Min(1)
	@Field(() => Int)
	page: number;

	@IsNotEmpty()
	@Min(1)
	@Field(() => Int)
	limit: number;

	@IsNotEmpty()
	@Field(() => NISearch)
	search: NISearch;
}
