import { CreatorGuard } from '@common/guards';
import { Body, Controller, Get, Param, ParseIntPipe, Post, UseGuards } from '@nestjs/common';
import { CreatorReviewService } from '../applications/creator-review.service';
import { Context, ContextKey } from '@common/context';
import { Creator } from '@modules/creator/domain/creator.entity';
import { ReviewCreateDto } from './dto';

@Controller('creators/reviews')
@UseGuards(CreatorGuard)
export class CreatorReviewController {
  constructor(
    private readonly creatorReviewService: CreatorReviewService,
    private readonly context: Context
  ) {}

  @Post()
  async create(@Body() body: ReviewCreateDto) {
    // 1. Destructure body, params, query
    // 2. Get context
    const creator = this.context.get<Creator>(ContextKey.CREATOR);

    // 3. Get result
    await this.creatorReviewService.create({ creator, ...body });

    // 4. Send response
    return { data: {} };
  }

  @Get('episodes/:episodeId')
  async getEpisodeReview(@Param('episodeId', ParseIntPipe) episodeId: number) {
    // 1. Destructure body, params, query
    // 2. Get context
    const creator = this.context.get<Creator>(ContextKey.CREATOR);

    // 3. Get result
    const data = await this.creatorReviewService.retrieve({ creator, episodeId });

    // 4. Send response
    return { data };
  }
}
