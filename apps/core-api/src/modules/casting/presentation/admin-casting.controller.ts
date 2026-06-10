import { AdminGuard } from '@common/guards';
import { AdminCastingService } from '@modules/casting/applications/admin-casting.service';
import { CastingCreateDto, CastingQueryDto } from '@modules/casting/presentation/dto';
import { Body, Controller, Get, Param, ParseIntPipe, Post, Query, UseGuards } from '@nestjs/common';

@Controller('admins/contents/:contentId/castings')
@UseGuards(AdminGuard)
export class AdminCastingController {
  constructor(private readonly adminCastingService: AdminCastingService) {}

  @Post()
  async create(@Param('contentId', ParseIntPipe) contentId: number, @Body() body: CastingCreateDto) {
    // 1. Destructure body, params, query
    // 2. Get context
    // 3. Get result
    await this.adminCastingService.create({ ...body, contentId });

    // 4. Send response
    return { data: {} };
  }

  @Get()
  async list(@Param('contentId', ParseIntPipe) contentId: number, @Query() query: CastingQueryDto) {
    // 1. Destructure body, params, query
    const { ...options } = query;

    // 2. Get context
    // 3. Get result
    const data = await this.adminCastingService.list({ contentId }, options);

    // 4. Send response
    return { data };
  }
}
