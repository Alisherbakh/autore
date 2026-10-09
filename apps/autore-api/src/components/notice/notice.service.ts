import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ObjectId } from 'mongoose';
import { Notice, Notices } from '../../libs/dto/notice/notice';
import { NoticeInput, NoticesInquiry } from '../../libs/dto/notice/notice.input';
import { NoticeUpdate } from '../../libs/dto/notice/notice.update';
import { NoticeStatus } from '../../libs/enums/notice.enum';
import { Message } from '../../libs/enums/common.enum';
import { T } from '../../libs/types/common';

@Injectable()
export class NoticeService {
	constructor(@InjectModel('Notice') private readonly noticeModel: Model<Notice>) {}

	// public: faqat ACTIVE holatdagi Notice / FAQ
	public async getNotices(input: NoticesInquiry): Promise<Notices> {
		return await this.findNotices(input, NoticeStatus.ACTIVE);
	}

	/** ADMIN **/

	public async createNotice(memberId: ObjectId, input: NoticeInput): Promise<Notice> {
		input.memberId = memberId; // qaysi admin yozgani
		try {
			return await this.noticeModel.create(input);
		} catch (err) {
			console.log('Error, Service.model:', err.message);
			throw new InternalServerErrorException(Message.CREATE_FAILED);
		}
	}

	// admin: hamma holatlar (status berilmasa DELETE'dan boshqa hammasi)
	public async getAllNoticesByAdmin(input: NoticesInquiry): Promise<Notices> {
		return await this.findNotices(input, input.search.noticeStatus);
	}

	// tahrirlash; o'chirish = noticeStatus: DELETE (bazadan butunlay o'chirilmaydi)
	public async updateNoticeByAdmin(input: NoticeUpdate): Promise<Notice> {
		const result = await this.noticeModel.findOneAndUpdate({ _id: input._id }, input, { new: true }).exec();
		if (!result) throw new InternalServerErrorException(Message.UPDATE_FAILED);
		return result;
	}

	private async findNotices(input: NoticesInquiry, status?: NoticeStatus): Promise<Notices> {
		const { noticeCategory, text } = input.search;
		const match: T = { noticeCategory };
		match.noticeStatus = status ? status : { $ne: NoticeStatus.DELETE };
		if (text) {
			const safe = text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // regex belgilarini xavfsiz qiladi
			match.noticeTitle = { $regex: new RegExp(safe, 'i') };
		}

		const result = await this.noticeModel
			.aggregate([
				{ $match: match },
				{ $sort: { createdAt: -1 } },
				{
					$facet: {
						list: [{ $skip: (input.page - 1) * input.limit }, { $limit: input.limit }],
						metaCounter: [{ $count: 'total' }],
					},
				},
			])
			.exec();

		return result[0];
	}
}
