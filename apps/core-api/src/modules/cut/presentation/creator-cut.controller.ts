import { CreatorGuard } from '@common/guards';
import { Controller, Get, Param, ParseIntPipe, UseGuards } from '@nestjs/common';
import { CreatorCutService } from '../applications/creator-cut.service';

@Controller('creators/episodes/:episodeId/cuts')
@UseGuards(CreatorGuard)
export class CreatorCutController {
  constructor(private readonly creatorCutService: CreatorCutService) {}

  @Get()
  async list(@Param('episodeId', ParseIntPipe) episodeId: number) {
    // 1. Destructure body, params, query
    // 2. Get context
    // 3. Get result
    const data = await this.creatorCutService.list({ episodeId });

    // 4. Send response
    return { data };
  }
}
