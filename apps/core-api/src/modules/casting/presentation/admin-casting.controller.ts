import { AdminGuard } from '@common/guards';
import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Put, Query, UseGuards } from '@nestjs/common';
import { AdminCastingService } from '../applications/admin-casting.service';
import { CastingChangePublishDto, CastingCreateDto, AdminCastingQueryDto } from './dto';

@Controller('admins/characters/:characterId/castings')
@UseGuards(AdminGuard)
export class AdminCastingController {
  constructor(private readonly adminCastingService: AdminCastingService) {}

  @Post()
  async create(@Param('characterId', ParseIntPipe) characterId: number, @Body() body: CastingCreateDto) {
    // 1. Destructure body, params, query
    // 2. Get context
    // 3. Get result
    await this.adminCastingService.create({ characterId, ...body });

    // 4. Send response
    return { data: {} };
  }

  @Get()
  async list(@Param('characterId', ParseIntPipe) characterId: number, @Query() query: AdminCastingQueryDto) {
    // 1. Destructure body, params, query
    const { ...options } = query;

    // 2. Get context
    // 3. Get result
    const data = await this.adminCastingService.list({ characterId }, options);

    // 4. Send response
    return { data };
  }

  @Delete(':castingId')
  async remove(
    @Param('characterId', ParseIntPipe) characterId: number,
    @Param('castingId', ParseIntPipe) castingId: number
  ) {
    // 1. Destructure body, params, query
    // 2. Get context
    // 3. Get result
    await this.adminCastingService.remove({ id: castingId, characterId });
    // 4. Send response
    return { data: {} };
  }

  @Put(':castingId/publish')
  async changePublish(
    @Param('characterId', ParseIntPipe) characterId: number,
    @Param('castingId', ParseIntPipe) castingId: number,
    @Body() body: CastingChangePublishDto
  ) {
    // 1. Destructure body, params, query
    // 2. Get context
    // 3. Get result
    await this.adminCastingService.changePublish({ id: castingId, characterId, ...body });

    // 4. Send response
    return { data: {} };
  }
}
