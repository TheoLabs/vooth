import { AdminGuard } from '@common/guards';
import { Body, Controller, Get, Param, ParseIntPipe, Post, Query, UseGuards } from '@nestjs/common';
import { AdminCharacterService } from '../applications/admin-character.service';
import { CharacterCreateDto, CharacterQueryDto } from './dto';

@Controller('admins/contents/:contentId/characters')
@UseGuards(AdminGuard)
export class AdminCharacterController {
  constructor(private readonly adminCharacterService: AdminCharacterService) {}

  @Post()
  async create(@Param('contentId', ParseIntPipe) contentId: number, @Body() body: CharacterCreateDto) {
    // 1. Destructure body, params, query
    // 2. Get context
    // 3. Get result
    await this.adminCharacterService.create({ contentId, ...body });

    // 4. Send response
    return { data: {} };
  }

  @Get()
  async list(@Param('contentId', ParseIntPipe) contentId: number, @Query() query: CharacterQueryDto) {
    // 1. Destructure body, params, query
    const { types, ...options } = query;

    // 2. Get context
    // 3. Get result
    const data = await this.adminCharacterService.list({ contentId, types }, options);

    // 4. Send response
    return { data };
  }
}
