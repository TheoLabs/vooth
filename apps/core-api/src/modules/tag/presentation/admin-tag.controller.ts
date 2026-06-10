import { AdminGuard } from '@common/guards';
import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Put, Query, UseGuards } from '@nestjs/common';
import { AdminTagService } from '../applications/admin-tag.service';
import { TagCreateDto, TagQueryDto, TagUpdateDto } from './dto';

@Controller('admins/tags')
@UseGuards(AdminGuard)
export class AdminTagController {
  constructor(private readonly adminTagService: AdminTagService) {}

  @Post()
  async create(@Body() body: TagCreateDto) {
    // 1. Destructure body, params, query
    // 2. Get context
    // 3. Get result
    await this.adminTagService.create(body);

    // 4. Send response
    return { data: {} };
  }

  @Get()
  async list(@Query() query: TagQueryDto) {
    // 1. Destructure body, params, query
    const { searchKey, searchValue, ...options } = query;

    // 2. Get context
    // 3. Get result
    const data = await this.adminTagService.list({ searchKey, searchValue }, options);

    // 4. Send response
    return { data };
  }

  @Put(':id')
  async update(@Param('id', ParseIntPipe) id: number, @Body() body: TagUpdateDto) {
    // 1. Destructure body, params, query
    // 2. Get context
    // 3. Get result
    await this.adminTagService.update({ id, ...body });

    // 4. Send response
    return { data: {} };
  }

  @Delete(':id')
  async delete(@Param('id', ParseIntPipe) id: number) {
    // 1. Destructure body, params, query
    // 2. Get context
    // 3. Get result
    await this.adminTagService.remove({ id });

    // 4. Send response
    return { data: {} };
  }
}
