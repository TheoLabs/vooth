import { AdminGuard } from '@common/guards';
import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { AdminContentService } from '../applications/admin-content.service';

@Controller('admins/contents')
@UseGuards(AdminGuard)
export class AdminContentController {
  constructor(private readonly adminContentService: AdminContentService) {}

  @Post()
  async create(@Body() body: any) {
    // 1. Destructure body, params, query
    // 2. Get context
    // 3. Get result
    // 4. Send response
    return { data: {} };
  }

  @Get()
  async list() {
    // 1. Destructure body, params, query
    // 2. Get context
    // 3. Get result
    // 4. Send response
    return { data: {} };
  }
}
