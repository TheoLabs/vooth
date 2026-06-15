import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { DirectorTakeService } from '../applications/director-take.service';

/**
 * 연출·제작 표면(검수/렌더). 임시 공개 — DirectorGuard 는 tool 관리자 로그인 연결 후 적용.
 */
@Controller('directors/episodes/:episodeId/takes')
export class DirectorTakeController {
  constructor(private readonly directorTakeService: DirectorTakeService) {}

  @Get()
  async list(@Param('episodeId', ParseIntPipe) episodeId: number) {
    const data = await this.directorTakeService.listByEpisode({ episodeId });

    return { data };
  }
}
