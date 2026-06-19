import { AdminGuard } from '@common/guards';
import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Put, Query, UseGuards } from '@nestjs/common';
import { AdminCutService } from '../applications/admin-cut.service';

@Controller('admins/cuts')
@UseGuards(AdminGuard)
export class AdminCutController {
  constructor(private readonly adminCutService: AdminCutService) {}

  @Post()
  async create(@Body() body: any) {
    // 1. Destructure body, params, query
    // 2. Get context
    // 3. Get result
    // 4. Send response
    return { data: {} };
  }

  @Get()
  async list(@Query() query: any) {
    // 1. Destructure body, params, query
    // 2. Get context
    // 3. Get result
    // 4. Send response
    return { data: {} };
  }

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
