import { DirectorGuard } from '@common/guards';
import { Body, Controller, Param, ParseIntPipe, Post, UseGuards } from '@nestjs/common';
import { DirectorLineService } from '../applications/director-line.service';
import { LineSetAnchorYDto } from '@modules/cut/presentation/dto';

@Controller('directors/episodes/:episodeId/lines')
@UseGuards(DirectorGuard)
export class DirectorLineController {
  constructor(private readonly directorLineService: DirectorLineService) {}

  @Post()
  async setAnchorY(@Param('episodeId', ParseIntPipe) episodeId: number, @Body() body: LineSetAnchorYDto) {
    // 1. Destructure body, params, query
    // 2. Get context
    // 3. Get result
    await this.directorLineService.setAnchorY({ episodeId, ...body });

    // 4. Send response
    return { data: {} };
  }
}
