import { AdminGuard } from '@common/guards';
import { Body, Controller, Delete, Param, ParseIntPipe, Post, Put, UseGuards } from '@nestjs/common';
import { AdminLineService } from '../applications/admin-line.service';
import { AdminLineCreateDto, AdminLineUpdateDto } from './dto';

@Controller('admins/cuts/:cutId/lines')
@UseGuards(AdminGuard)
export class AdminLineController {
  constructor(private readonly adminLineService: AdminLineService) {}

  @Post()
  async create(@Param('cutId', ParseIntPipe) cutId: number, @Body() body: AdminLineCreateDto) {
    // 1. Destructure body, params, query
    // 2. Get context
    // 3. Get result
    await this.adminLineService.create({ cutId, ...body });

    // 4. Send response
    return { data: {} };
  }

  @Put(':lineId')
  async update(
    @Param('cutId', ParseIntPipe) cutId: number,
    @Param('lineId', ParseIntPipe) lineId: number,
    @Body() body: AdminLineUpdateDto
  ) {
    // 1. Destructure body, params, query
    // 2. Get context
    // 3. Get result
    await this.adminLineService.update({ cutId, lineId, ...body });

    // 4. Send response
    return { data: {} };
  }

  @Delete(':lineId')
  async remove(@Param('cutId', ParseIntPipe) cutId: number, @Param('lineId', ParseIntPipe) lineId: number) {
    // 1. Destructure body, params, query
    // 2. Get context
    // 3. Get result
    await this.adminLineService.remove({ cutId, lineId });

    // 4. Send response
    return { data: {} };
  }
}
