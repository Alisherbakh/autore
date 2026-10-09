import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import type { ObjectId } from 'mongoose';
import { NoticeService } from './notice.service';
import { Notice, Notices } from '../../libs/dto/notice/notice';
import { NoticeInput, NoticesInquiry } from '../../libs/dto/notice/notice.input';
import { NoticeUpdate } from '../../libs/dto/notice/notice.update';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AuthMember } from '../auth/decorators/authMember.decorator';
import { MemberType } from '../../libs/enums/member.enum';
import { shapeIntoMongoObjectId } from '../../libs/config';

@Resolver()
export class NoticeResolver {
	constructor(private readonly noticeService: NoticeService) {}

	// hamma uchun ochiq (login shart emas): CS sahifasidagi Notice va FAQ
	@Query((returns) => Notices)
	public async getNotices(@Args('input') input: NoticesInquiry): Promise<Notices> {
		console.log('Query: getNotices');
		return await this.noticeService.getNotices(input);
	}

	/** ADMIN **/

	@Roles(MemberType.ADMIN)
	@UseGuards(RolesGuard)
	@Mutation((returns) => Notice)
	public async createNotice(@Args('input') input: NoticeInput, @AuthMember('_id') memberId: ObjectId): Promise<Notice> {
		console.log('Mutation: createNotice');
		return await this.noticeService.createNotice(memberId, input);
	}

	@Roles(MemberType.ADMIN)
	@UseGuards(RolesGuard)
	@Query((returns) => Notices)
	public async getAllNoticesByAdmin(@Args('input') input: NoticesInquiry): Promise<Notices> {
		console.log('Query: getAllNoticesByAdmin');
		return await this.noticeService.getAllNoticesByAdmin(input);
	}

	@Roles(MemberType.ADMIN)
	@UseGuards(RolesGuard)
	@Mutation((returns) => Notice)
	public async updateNoticeByAdmin(@Args('input') input: NoticeUpdate): Promise<Notice> {
		console.log('Mutation: updateNoticeByAdmin');
		input._id = shapeIntoMongoObjectId(input._id);
		return await this.noticeService.updateNoticeByAdmin(input);
	}
}
