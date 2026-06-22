import { AdminGuard } from '@common/guards';
import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Put, UseGuards } from '@nestjs/common';
import { AdminCutService } from '../applications/admin-cut.service';
import { AdminCutCreateDto, AdminCutUpdateDto } from './dto';

@Controller('admins/episodes/:episodeId/cuts')
@UseGuards(AdminGuard)
export class AdminCutController {
  constructor(private readonly adminCutService: AdminCutService) {}

  @Post()
  async create(@Param('episodeId', ParseIntPipe) episodeId: number, @Body() body: AdminCutCreateDto) {
    // 1. Destructure body, params, query
    // 2. Get context
    // 3. Get result
    await this.adminCutService.create({ episodeId, ...body });

    // 4. Send response
    return { data: {} };
  }

  @Get()
  async list(@Param('episodeId', ParseIntPipe) episodeId: number) {
    // 1. Destructure body, params, query
    // 2. Get context
    // 3. Get result
    const data = await this.adminCutService.list({ episodeId });

    // 4. Send response
    return { data };
  }

  @Put(':id')
  async update(
    @Param('episodeId', ParseIntPipe) episodeId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: AdminCutUpdateDto
  ) {
    // 1. Destructure body, params, query
    // 2. Get context
    // 3. Get result
    await this.adminCutService.update({ id, episodeId, ...body });
    // 4. Send response
    return { data: {} };
  }

  @Delete(':id')
  async remove(@Param('episodeId', ParseIntPipe) episodeId: number, @Param('id', ParseIntPipe) id: number) {
    // 1. Destructure body, params, query
    // 2. Get context
    // 3. Get result
    await this.adminCutService.remove({ id, episodeId });

    // 4. Send response
    return { data: {} };
  }
}
