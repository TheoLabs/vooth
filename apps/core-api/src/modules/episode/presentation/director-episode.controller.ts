import { DirectorGuard } from '@common/guards';
import { Body, Controller, Get, Param, ParseIntPipe, Put, Query, UseGuards } from '@nestjs/common';
import { DirectorEpisodeService } from '../applications/director-episode.service';
import { DirectorEpisodeQueryDto, DirectorEpisodeStatusChangeDto } from './dto';

@Controller('directors/contents/:contentId/episodes')
@UseGuards(DirectorGuard)
export class DirectorEpisodeController {
  constructor(private readonly directorEpisodeService: DirectorEpisodeService) {}

  @Get()
  async list(@Param('contentId', ParseIntPipe) contentId: number, @Query() query: DirectorEpisodeQueryDto) {
    // 1. Destructure body, params, query
    const { searchValue, statuses, ...options } = query;

    // 2. Get context
    // 3. Get result
    const data = await this.directorEpisodeService.list({ contentId, searchValue, statuses }, options);

    // 4. Send response
    return { data };
  }

  @Get(':episodeId')
  async retrieve(
    @Param('contentId', ParseIntPipe) contentId: number,
    @Param('episodeId', ParseIntPipe) episodeId: number
  ) {
    // 1. Destructure body, params, query
    // 2. Get context
    // 3. Get result
    const data = await this.directorEpisodeService.retrieve({ id: episodeId, contentId });

    // 4. Send response
    return { data };
  }

  @Put(':episodeId/status')
  async ready(
    @Param('contentId', ParseIntPipe) contentId: number,
    @Param('episodeId', ParseIntPipe) episodeId: number,
    @Body() body: DirectorEpisodeStatusChangeDto
  ) {
    // 1. Destructure body, params, query
    // 2. Get context
    // 3. Get result
    await this.directorEpisodeService.changeStatus({ contentId, episodeId, ...body });

    // 4. Send response
    return { data: {} };
  }
}
