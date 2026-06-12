import { Body, Controller, Get, Param, ParseIntPipe, Patch, Query } from '@nestjs/common';
import { DirectorEpisodeService } from '../applications/director-episode.service';
import { EpisodeDirectionDto, EpisodeQueryDto } from './dto';

/**
 * 연출(vooth-tool) 표면 — 인증/권한 없이 공개(임시, 추후 가드 추가).
 */
@Controller('directors/episodes')
export class DirectorEpisodeController {
  constructor(private readonly directorEpisodeService: DirectorEpisodeService) {}

  @Get()
  async list(@Query() query: EpisodeQueryDto) {
    const { searchKey, searchValue, statuses, ...options } = query;

    const data = await this.directorEpisodeService.list({ statuses, searchKey, searchValue }, options);

    return { data };
  }

  @Get(':id')
  async retrieve(@Param('id', ParseIntPipe) id: number) {
    const data = await this.directorEpisodeService.retrieve({ id });

    return { data };
  }

  @Patch(':id/direction')
  async saveDirection(@Param('id', ParseIntPipe) id: number, @Body() body: EpisodeDirectionDto) {
    await this.directorEpisodeService.saveDirection({ id, cuts: body.cuts });

    return { data: {} };
  }
}
