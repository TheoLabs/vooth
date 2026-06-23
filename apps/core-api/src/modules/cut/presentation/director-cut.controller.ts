import { DirectorGuard } from '@common/guards';
import { Controller, Get, Param, ParseIntPipe, Query, UseGuards } from '@nestjs/common';
import { DirectorCutService } from '../applications/director-cut.service';

@Controller('directors/episodes/:episodeId/cuts')
@UseGuards(DirectorGuard)
export class DirectorCutController {
  constructor(private readonly directorCutService: DirectorCutService) {}

  @Get()
  async list(@Param('episodeId', ParseIntPipe) episodeId: number, @Query() query: any) {
    // 1. Destructure body, params, query
    const { ...options } = query;

    // 2. Get context
    // 3. Get result
    const data = await this.directorCutService.list({ episodeId }, options);

    // 4. Send response
    return { data };
  }
}
