import { Controller, Get, Param, ParseIntPipe, Query, UseGuards } from '@nestjs/common';
import { DirectorEpisodeService } from '../applications/director-episode.service';
import { DirectorGuard } from '@common/guards';
import { DirectorEpisodeQueryDto } from './dto';

@Controller('directors/contents/:contentId/episodes')
@UseGuards(DirectorGuard)
export class DirectorEpisodeController {
  constructor(private readonly directorEpisodeService: DirectorEpisodeService) {}

  @Get()
  async list(@Param('contentId', ParseIntPipe) contentId: number, @Query() query: DirectorEpisodeQueryDto) {
    // 1. Destructure body, params, query
    const { ...options } = query;

    // 2. Get context
    // 3. Get result
    const data = await this.directorEpisodeService.list({ contentId }, options);

    // 4. Send response
    return { data };
  }

  @Get('stats')
  async statsCount(@Param('contentId', ParseIntPipe) contentId: number) {
    // 1. Destructure body, params, query
    // 2. Get context
    // 3. Get result
    const data = await this.directorEpisodeService.getStatsCount({ contentId });

    // 4. Send response
    return { data };
  }
}
