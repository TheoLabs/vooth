import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Put, Query } from '@nestjs/common';
import { AdminCharacterService } from '../applications/admin-character.service';
import { AdminCharacterCreateDto, AdminCharacterQueryDto, AdminCharacterUpdateDto } from './dto';

@Controller('admins/contents/:contentId/characters')
export class AdminCharacterController {
  constructor(private readonly adminCharacterService: AdminCharacterService) {}

  @Post()
  async create(@Param('contentId', ParseIntPipe) contentId: number, @Body() body: AdminCharacterCreateDto) {
    // 1. Destructure body, params, query
    // 2. Get context
    // 3. Get result
    await this.adminCharacterService.create({ contentId, ...body });

    // 4. Send response
    return { data: {} };
  }

  @Get()
  async list(@Param('contentId', ParseIntPipe) contentId: number, @Query() query: AdminCharacterQueryDto) {
    // 1. Destructure body, params, query
    const { types, searchKey, searchValue, ...options } = query;
    // 2. Get context
    // 3. Get result
    const data = await this.adminCharacterService.list({ contentId, types, searchKey, searchValue }, options);

    // 4. Send response
    return { data };
  }

  @Get(':id')
  async retrieve(@Param('contentId', ParseIntPipe) contentId: number, @Param('id', ParseIntPipe) id: number) {
    // 1. Destructure body, params, query
    // 2. Get context
    // 3. Get result
    const data = await this.adminCharacterService.retrieve({ id, contentId });

    // 4. Send response
    return { data };
  }

  @Put(':id')
  async update(
    @Param('contentId', ParseIntPipe) contentId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: AdminCharacterUpdateDto
  ) {
    // 1. Destructure body, params, query
    // 2. Get context
    // 3. Get result
    await this.adminCharacterService.update({ id, contentId, ...body });

    // 4. Send response
    return { data: {} };
  }

  @Delete(':id')
  async remove(@Param('contentId', ParseIntPipe) contentId: number, @Param('id', ParseIntPipe) id: number) {
    // 1. Destructure body, params, query
    // 2. Get context
    // 3. Get result
    await this.adminCharacterService.remove({ id, contentId });

    // 4. Send response
    return { data: {} };
  }
}
