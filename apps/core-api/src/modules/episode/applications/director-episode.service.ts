import { DddService } from '@libs/ddd';
import { BadRequestException, Injectable } from '@nestjs/common';
import { EpisodeRepository } from '../infrastructure/episode.repository';
import { EpisodeStatus } from '@vooth/shared';
import { PaginationOptions } from '@libs/utils';
import { CutRepository } from '@modules/cut/infrastructure/cut.repository';
import { DirectorEpisodeListResponseDto } from '../presentation/dto';
import { Transactional } from '@libs/decorators';

@Injectable()
export class DirectorEpisodeService extends DddService {
  constructor(
    private readonly episodeRepository: EpisodeRepository,
    private readonly cutRepository: CutRepository
  ) {
    super();
  }

  async list(
    {
      contentId,
      searchValue,
      statuses,
    }: {
      contentId?: number;
      searchValue?: string;
      statuses?: EpisodeStatus[];
    },
    options?: PaginationOptions
  ) {
    // 콘텐츠 범위 목록이라 검색 대상은 title 로 고정한다.
    const conditions = { contentId, searchKey: 'title', searchValue, statuses };

    const [episodes, total] = await Promise.all([
      this.episodeRepository.find(conditions, { options }),
      this.episodeRepository.count(conditions),
    ]);

    const [cutCountMap, lineCountMap] = await Promise.all([
      this.cutRepository.countGroupByEpisodeId(episodes.map(({ id }) => id)),
      this.cutRepository.countLinesGroupByEpisodeId(episodes.map(({ id }) => id)),
    ]);

    return {
      items: episodes.map((episode) =>
        episode.toInstance(DirectorEpisodeListResponseDto, {
          cutCount: cutCountMap.get(episode.id),
          lineCount: lineCountMap.get(episode.id),
        })
      ),
      total,
    };
  }

  async retrieve({ id, contentId }: { id: number; contentId: number }) {
    const [episode] = await this.episodeRepository.find({ id, contentId });

    if (!episode) {
      throw new BadRequestException('해당 에피소드를 찾을 수 없습니다.', {
        cause: '해당 에피소드를 찾을 수 없습니다.',
      });
    }

    return episode;
  }

  @Transactional()
  async changeStatus({
    contentId,
    episodeId,
    status,
  }: {
    contentId: number;
    episodeId: number;
    status: EpisodeStatus;
  }) {
    const [episode] = await this.episodeRepository.find({ id: episodeId, contentId });

    if (!episode) {
      throw new BadRequestException('해당 에피소드를 찾을 수 없습니다.', {
        cause: '해당 에피소드를 찾을 수 없습니다.',
      });
    }

    episode.transitionTo(status);

    await this.episodeRepository.save([episode]);
  }
}
