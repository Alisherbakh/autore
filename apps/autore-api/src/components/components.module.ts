import { Module } from '@nestjs/common';
import { MemberModule } from './member/member.module';
import { CarModule } from './car/car.module';
import { BoardArticleModule } from './board-article/board-article.module';
import { AuthModule } from './auth/auth.module';
import { CommentModule } from './comment/comment.module';
import { LikeModule } from './like/like.module';
import { ViewModule } from './view/view.module';
import { FollowModule } from './follow/follow.module';
import { NoticeModule } from './notice/notice.module';
import { AiModule } from './ai/ai.module';

@Module({
  imports: [
    MemberModule, 
    CarModule, 
    BoardArticleModule, 
    AuthModule, 
    CommentModule, 
    LikeModule, 
    ViewModule, 
    FollowModule,
    NoticeModule,
    AiModule,
  ],
})
export class ComponentsModule {}
