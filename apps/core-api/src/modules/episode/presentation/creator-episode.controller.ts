import { CreatorGuard } from '@common/guards';
import { Controller, Get, Param, ParseIntPipe, Query, UseGuards } from '@nestjs/common';
import { CreatorEpisodeService } from '../applications/creator-episode.service';
import { Context, ContextKey } from '@common/context';
import { Creator } from '@modules/creator/domain/creator.entity';
import { CreatorEpisodeQueryDto } from './dto';

@Controller('creators/contents/:contentId/episodes')
@UseGuards(CreatorGuard)
export class CreatorEpisodeController {
  constructor(
    private readonly creatorEpisodeService: CreatorEpisodeService,
    private readonly context: Context
  ) {}

  @Get()
  async list(@Param('contentId', ParseIntPipe) contentId: number, @Query() query: CreatorEpisodeQueryDto) {
    // 1. Destructure body, params, query
    const { searchKey, searchValue, ...options } = query;

    // 2. Get context
    const creator = this.context.get<Creator>(ContextKey.CREATOR);

    // 3. Get result
    const data = await this.creatorEpisodeService.list({ creator, contentId, searchKey, searchValue }, options);

    // 4. Send response
    return { data };
  }
}
