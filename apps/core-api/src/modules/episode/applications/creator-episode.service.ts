import { DddService } from '@libs/ddd';
import { BadRequestException, Injectable } from '@nestjs/common';
import { EpisodeRepository } from '../infrastructure/episode.repository';
import { Creator } from '@modules/creator/domain/creator.entity';
import { ContentRepository } from '@modules/content/infrastructure/content.repository';
import { CreatorAccessibleContentSpec } from '@modules/content/domain/specs';
import { PaginationOptions } from '@libs/utils';

@Injectable()
export class CreatorEpisodeService extends DddService {
  constructor(
    private readonly contentRepository: ContentRepository,
    private readonly episodeRepository: EpisodeRepository
  ) {
    super();
  }

  async list(
    {
      creator,
      contentId,
      searchKey,
      searchValue,
    }: {
      creator: Creator;
      contentId: number;
      searchKey?: string;
      searchValue?: string;
    },
    options?: PaginationOptions
  ) {
    const [content] = await this.contentRepository.satisfyElementFrom(
      new CreatorAccessibleContentSpec({ ids: [contentId], searchKey, searchValue })
    );

    if (!content) {
      throw new BadRequestException('존재하지 않는 콘텐츠입니다.', {
        cause: '존재하지 않는 콘텐츠입니다.',
      });
    }

    const [episodes, total] = await Promise.all([
      this.episodeRepository.find({ contentId }, { options }),
      this.episodeRepository.count({ contentId }),
    ]);

    return { items: episodes, total };
  }
}
