import { Module } from '@nestjs/common';
import { ReviewRepository } from './infrastructure/review.repository';
import { CreatorReviewService } from './applications/creator-review.service';
import { EpisodeModule } from '@modules/episode/episode.module';
import { LineTakeModule } from '@modules/line-take/line-take.module';
import { CastingModule } from '@modules/casting/casting.module';
import { CreatorReviewController } from './presentation/creator-review.controller';

@Module({
  imports: [EpisodeModule, LineTakeModule, CastingModule],
  controllers: [CreatorReviewController],
  providers: [ReviewRepository, CreatorReviewService],
  exports: [ReviewRepository, CreatorReviewService],
})
export class ReviewModule {}
