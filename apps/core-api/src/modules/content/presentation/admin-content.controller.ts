import { AdminGuard } from '@common/guards';
import { Body, Controller, Get, Param, ParseIntPipe, Post, Put, Query, UseGuards } from '@nestjs/common';
import { AdminContentService } from '../applications/admin-content.service';
import { ContentCreateDto, ContentQueryDto, ContentUpdateDto } from './dto';

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
  async list(@Query() query: ContentQueryDto) {
    // 1. Destructure body, params, query
    const { searchKey, searchValue, statuses, ...options } = query;

    // 2. Get context
    // 3. Get result
    const data = await this.adminContentService.list({ searchKey, searchValue, statuses }, options);

    // 4. Send response
    return { data };
  }

  @Get(':id')
  async retrieve(@Param('id', ParseIntPipe) id: number) {
    // 1. Destructure body, params, query
    // 2. Get context
    // 3. Get result
    const data = await this.adminContentService.retrieve({ id });

    // 4. Send response
    return { data };
  }

  @Put(':id')
  async update(@Param('id', ParseIntPipe) id: number, @Body() body: ContentUpdateDto) {
    // 1. Destructure body, params, query
    // 2. Get context
    // 3. Get result
    await this.adminContentService.update({ id, ...body });

    // 4. Send response
    return { data: {} };
  }
}
