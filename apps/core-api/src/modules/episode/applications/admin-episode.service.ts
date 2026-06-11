import { DddService } from '@libs/ddd';
import { BadRequestException, Injectable } from '@nestjs/common';
import { EpisodeRepository } from '../infrastructure/episode.repository';
import { Transactional } from '@libs/decorators';
import { ContentRepository } from '@modules/content/infrastructure/content.repository';
import { Episode } from '../domain/episode.entity';
import { PaginationOptions } from '@libs/utils';
import { EpisodeResponseDto } from '../presentation/dto';

@Injectable()
export class AdminEpisodeService extends DddService {
  constructor(
    private readonly episodeRepository: EpisodeRepository,
    private readonly contentRepository: ContentRepository
  ) {
    super();
  }

  @Transactional()
  async create({ contentId, title, chapter }: { contentId: number; title: string; chapter: number }) {
    const [exisitingContent] = await this.contentRepository.find({ id: contentId });

    if (!exisitingContent) {
      throw new BadRequestException('존재하지 않는 콘텐츠입니다.', {
        cause: '존재하지 않는 콘텐츠입니다.',
      });
    }

    const [exisitingEpisode] = await this.episodeRepository.find({ contentId, chapter });

    if (exisitingEpisode) {
      throw new BadRequestException('이미 등록된 회차입니다.', { cause: '이미 등록된 회차입니다.' });
    }

    const episode = Episode.of({
      contentId,
      title,
      chapter,
    });

    await this.episodeRepository.save([episode]);
  }

  async list(
    {
      contentId,
      statuses,
      searchKey,
      searchValue,
    }: { contentId?: number; statuses?: string[]; searchKey?: string; searchValue?: string },
    options?: PaginationOptions
  ) {
    const [episodes, total] = await Promise.all([
      this.episodeRepository.find({ contentId, statuses, searchKey, searchValue }, { options }),
      this.episodeRepository.count({ contentId, statuses, searchKey, searchValue }),
    ]);

    return { items: episodes.map((e) => e.toInstance(EpisodeResponseDto)), total };
  }
}
