import { AdminGuard } from '@common/guards';
import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Put, Query, UseGuards } from '@nestjs/common';
import { AdminContentQueryDto, ContentCreateDto } from './dto';
import { AdminContentService } from '../applications/admin-content.service';

@Controller('admins/contents')
@UseGuards(AdminGuard)
export class AdminContentController {
  constructor(private readonly adminContentService: AdminContentService) {}

  @Post()
  async create(@Body() body: ContentCreateDto) {
    // 1. Destructure body, params, query
    // 2. Get context
    // 3. Get result
    await this.adminContentService.create(body);

    // 4. Send response
    return { data: {} };
  }

  @Get()
  async list(@Query() query: AdminContentQueryDto) {
    // 1. Destructure body, params, query
    const { searchKey, searchValue, statuses, ...options } = query;

    // 2. Get context
    // 3. Get result
    const data = await this.adminContentService.list({ searchKey, searchValue, statuses }, options);

    // 4. Send response
    return { data };
  }

  @Get(':id')
  async retrieve(@Param('id', ParseIntPipe) id: number) {}

  @Put(':id')
  async update(@Param('id', ParseIntPipe) id: number, @Body() body: any) {
    // 1. Destructure body, params, query
    // 2. Get context
    // 3. Get result
    // 4. Send response
    return { data: {} };
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    // 1. Destructure body, params, query
    // 2. Get context
    // 3. Get result
    // 4. Send response
    return { data: {} };
  }
}
