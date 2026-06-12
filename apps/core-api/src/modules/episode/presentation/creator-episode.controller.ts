import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import { CreatorEpisodeService } from '../applications/creator-episode.service';
import { CreatorGuard } from '@common/guards';
import { UseGuards } from '@nestjs/common';

@Controller('creators/contents/:contentId/episodes')
@UseGuards(CreatorGuard)
export class CreatorEpisodeController {
  constructor(private readonly creatorEpisodeService: CreatorEpisodeService) {}

  @Get()
  async list(@Param('contentId', ParseIntPipe) contentId: number, @Query() query: any) {
    // 1. Destructure body, params, query
    const { ...options } = query;

    // 2. Get context
    // 3. Get result
    const data = await this.creatorEpisodeService.list({ contentId }, options);

    // 4. Send response
    return { data };
  }
}
