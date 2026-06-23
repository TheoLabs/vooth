import { DirectorGuard } from '@common/guards';
import { Controller, Get, Param, ParseIntPipe, Query, UseGuards } from '@nestjs/common';
import { DirectorCharacterService } from '../applications/director-character.service';

@Controller('directors/contents/:contentId/characters')
@UseGuards(DirectorGuard)
export class DirectorCharacterController {
  constructor(private readonly directorCharacterService: DirectorCharacterService) {}

  @Get()
  async list(@Param('contentId', ParseIntPipe) contentId: number, @Query() query: any) {
    // 1. Destructure body, params, query
    const { ...options } = query;

    // 2. Get context
    // 3. Get result
    const data = await this.directorCharacterService.list({ contentId }, options);

    // 4. Send response
    return { data };
  }
}
