import { DddService } from '@libs/ddd';
import { Injectable } from '@nestjs/common';
import { EpisodeRepository } from '../infrastructure/episode.repository';
import { EpisodeStatus } from '@vooth/shared';
import { PaginationOptions } from '@libs/utils';
import { CutRepository } from '@modules/cut/infrastructure/cut.repository';
import { DirectorEpisodeListResponseDto } from '../presentation/dto';

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
      searchKey,
      searchValue,
      statuses,
    }: {
      contentId?: number;
      searchKey?: string;
      searchValue?: string;
      statuses?: EpisodeStatus[];
    },
    options?: PaginationOptions
  ) {
    const [episodes, total] = await Promise.all([
      this.episodeRepository.find({ contentId, searchKey, searchValue, statuses }, { options }),
      this.episodeRepository.count({ contentId, searchKey, searchValue, statuses }),
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

  async retrieve() {}
}
