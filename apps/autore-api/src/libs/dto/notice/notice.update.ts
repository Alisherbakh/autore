import { Field, InputType } from '@nestjs/graphql';
import { IsNotEmpty, IsOptional, Length } from 'class-validator';
import { ObjectId } from 'mongoose';
import { NoticeStatus } from '../../enums/notice.enum';

// tahrirlash va o'chirish (noticeStatus: DELETE) shu bitta input orqali
@InputType()
export class NoticeUpdate {
	@IsNotEmpty()
	@Field(() => String) //@ts-ignore
	_id: ObjectId;

	@IsOptional()
	@Field(() => NoticeStatus, { nullable: true })
	noticeStatus?: NoticeStatus;

	@IsOptional()
	@Length(3, 100)
	@Field(() => String, { nullable: true })
	noticeTitle?: string;

	@IsOptional()
	@Length(3, 2000)
	@Field(() => String, { nullable: true })
	noticeContent?: string;
}
