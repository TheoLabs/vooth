import { CreatorGuard } from '@common/guards';
import { Controller, Get, Param, ParseIntPipe, UseGuards } from '@nestjs/common';
import { CreatorCutService } from '../applications/creator-cut.service';
import { Context, ContextKey } from '@common/context';
import { Creator } from '@modules/creator/domain/creator.entity';

@Controller('creators/episodes/:episodeId/cuts')
@UseGuards(CreatorGuard)
export class CreatorCutController {
  constructor(
    private readonly creatorCutService: CreatorCutService,
    private readonly context: Context
  ) {}

  @Get()
  async list(@Param('episodeId', ParseIntPipe) episodeId: number) {
    // 1. Destructure body, params, query
    // 2. Get context
    const creator = this.context.get<Creator>(ContextKey.CREATOR);

    // 3. Get result
    const data = await this.creatorCutService.list({ creator, episodeId });

    // 4. Send response
    return { data };
  }
}
