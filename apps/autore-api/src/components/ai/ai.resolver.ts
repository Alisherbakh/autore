import { Args, Context, Mutation, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import type { ObjectId } from 'mongoose';
import { AiService } from './ai.service';
import { AiAskInput } from '../../libs/dto/ai/ai.input';
import { AiAnswer } from '../../libs/dto/ai/ai';
import { WithoutGuard } from '../auth/guards/without.guard';
import { AuthMember } from '../auth/decorators/authMember.decorator';
import type { T } from '../../libs/types/common';

@Resolver()
export class AiResolver {
	constructor(private readonly aiService: AiService) {}

	// mehmon ham, login qilgan ham foydalana oladi; limit member (yoki IP) bo'yicha hisoblanadi
	@UseGuards(WithoutGuard)
	@Mutation(() => AiAnswer)
	public async askAssistant(
		@Args('input') input: AiAskInput,
		@AuthMember('_id') memberId: ObjectId,
		@Context('req') req: T,
	): Promise<AiAnswer> {
		console.log('Mutation: askAssistant');
		const forwarded = String(req?.headers?.['x-forwarded-for'] ?? '').split(',')[0].trim(); // VPS'da nginx orqasida
		const clientKey = memberId ? `member:${memberId}` : `ip:${forwarded || req?.ip || 'unknown'}`;
		return await this.aiService.ask(memberId, clientKey, input);
	}
}
