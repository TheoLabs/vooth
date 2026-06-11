import { AdminGuard } from '@common/guards';
import { Body, Controller, Get, Param, ParseIntPipe, Post, UseGuards, Query, Put } from '@nestjs/common';
import { AdminEpisodeService } from '../applications/admin-episode.service';
import { EpisodeCreateDto, EpisodeQueryDto, EpisodeUpdateDto } from './dto';

@Controller('admins/contents/:contentId/episodes')
@UseGuards(AdminGuard)
export class AdminEpisodeController {
  constructor(private readonly adminEpisodeService: AdminEpisodeService) {}

  @Post()
  async create(@Param('contentId', ParseIntPipe) contentId: number, @Body() body: EpisodeCreateDto) {
    // 1. Destructure body, params, query
    // 2. Get context
    // 3. Get result
    await this.adminEpisodeService.create({ contentId, ...body });

    // 4. Send response
    return { data: {} };
  }

  @Get()
  async list(@Param('contentId', ParseIntPipe) contentId: number, @Query() query: EpisodeQueryDto) {
    // 1. Destructure body, params, query
    const { statuses, searchKey, searchValue, ...options } = query;

    // 2. Get context
    // 3. Get result
    const data = await this.adminEpisodeService.list({ contentId, statuses, searchKey, searchValue }, options);

    // 4. Send response
    return { data };
  }

  @Get(':id')
  async retrieve(@Param('contentId', ParseIntPipe) contentId: number, @Param('id', ParseIntPipe) id: number) {
    // 1. Destructure body, params, query
    // 2. Get context
    // 3. Get result
    const data = await this.adminEpisodeService.retrieve({ contentId, id });

    // 4. Send response
    return { data };
  }

  @Put(':id')
  async update(
    @Param('contentId', ParseIntPipe) contentId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: EpisodeUpdateDto
  ) {
    // 1. Destructure body, params, query
    // 2. Get context
    // 3. Get result
    const data = await this.adminEpisodeService.update({ contentId, id, ...body });

    // 4. Send response
    return { data };
  }
}
