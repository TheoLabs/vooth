import { AdminGuard } from '@common/guards';
import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { AdminContentService } from '../applications/admin-content.service';
import { ContentCreateDto, ContentQueryDto } from './dto';

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
}
