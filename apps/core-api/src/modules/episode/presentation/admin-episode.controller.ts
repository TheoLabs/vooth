import { AdminGuard } from '@common/guards';
import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Put, Query, UseGuards } from '@nestjs/common';
import { AdminEpisodeService } from '../applications/admin-episode.service';
import { AdminEpisodeCreateDto, AdminEpisodeQueryDto, AdminEpisodeUpdateDto } from './dto';

@Controller('admins/contents/:contentId/episodes')
@UseGuards(AdminGuard)
export class AdminEpisodeController {
  constructor(private readonly adminEpisodeService: AdminEpisodeService) {}

  @Post()
  async create(@Param('contentId', ParseIntPipe) contentId: number, @Body() body: AdminEpisodeCreateDto) {
    // 1. Destructure body, params, query
    // 2. Get context
    // 3. Get result
    await this.adminEpisodeService.create({ contentId, ...body });
    // 4. Send response
    return { data: {} };
  }

  @Get()
  async list(@Param('contentId', ParseIntPipe) contentId: number, @Query() query: AdminEpisodeQueryDto) {
    // 1. Destructure body, params, query
    const { searchKey, searchValue, isFree, statuses, minExpectedPublishOn, maxExpectedPublishOn, ...options } = query;

    // 2. Get context
    // 3. Get result
    const data = await this.adminEpisodeService.list(
      { contentId, searchKey, searchValue, isFree, statuses, maxExpectedPublishOn, minExpectedPublishOn },
      options
    );

    // 4. Send response
    return { data };
  }

  @Get(':id')
  async retrieve(@Param('contentId', ParseIntPipe) contentId: number, @Param('id', ParseIntPipe) id: number) {
    // 1. Destructure body, params, query
    // 2. Get context
    // 3. Get result
    const data = await this.adminEpisodeService.retrieve({ id, contentId });

    // 4. Send response
    return { data };
  }

  @Put(':id')
  async update(
    @Param('contentId', ParseIntPipe) contentId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: AdminEpisodeUpdateDto
  ) {
    // 1. Destructure body, params, query
    // 2. Get context
    // 3. Get result
    await this.adminEpisodeService.update({ id, contentId, ...body });

    // 4. Send response
    return { data: {} };
  }

  @Delete(':id')
  async remove(@Param('contentId', ParseIntPipe) contentId: number, @Param('id', ParseIntPipe) id: number) {
    // 1. Destructure body, params, query
    // 2. Get context
    // 3. Get result
    await this.adminEpisodeService.remove({ id, contentId });

    // 4. Send response
    return { data: {} };
  }
}
