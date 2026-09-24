import { registerEnumType } from '@nestjs/graphql';

export enum BoardArticleCategory {
	FREE = 'FREE',
	REVIEW = 'REVIEW', // mashina haqida sharhlar
	NEWS = 'NEWS',
	TIPS = 'TIPS', // maslahatlar (xarid, xizmat ko'rsatish)
}
registerEnumType(BoardArticleCategory, {
	name: 'BoardArticleCategory',
});

export enum BoardArticleStatus {
	ACTIVE = 'ACTIVE',
	DELETE = 'DELETE',
}
registerEnumType(BoardArticleStatus, {
	name: 'BoardArticleStatus',
});
