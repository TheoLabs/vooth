import { DddService } from '@libs/ddd';
import { BadRequestException, Injectable } from '@nestjs/common';
import { EpisodeRepository } from '../infrastructure/episode.repository';
import { Transactional } from '@libs/decorators';
import { ContentRepository } from '@modules/content/infrastructure/content.repository';
import { Episode } from '../domain/episode.entity';
import { PaginationOptions } from '@libs/utils';
import { EpisodeResponseDto } from '../presentation/dto';
import { EpisodeStatus } from '@vooth/shared';
import { CharacterRepository } from '@modules/character/infrastructure/character.repository';

@Injectable()
export class AdminEpisodeService extends DddService {
  constructor(
    private readonly episodeRepository: EpisodeRepository,
    private readonly contentRepository: ContentRepository,
    private readonly characterRepository: CharacterRepository
  ) {
    super();
  }

  @Transactional()
  async create({ contentId, title, chapter }: { contentId: number; title: string; chapter: number }) {
    const [existingContent] = await this.contentRepository.find({ id: contentId });

    if (!existingContent) {
      throw new BadRequestException('존재하지 않는 콘텐츠입니다.', {
        cause: '존재하지 않는 콘텐츠입니다.',
      });
    }

    const [existingEpisode] = await this.episodeRepository.find({ contentId, chapter });

    if (existingEpisode) {
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
    }: { contentId?: number; statuses?: EpisodeStatus[]; searchKey?: string; searchValue?: string },
    options?: PaginationOptions
  ) {
    const [episodes, total] = await Promise.all([
      this.episodeRepository.find({ contentId, statuses, searchKey, searchValue }, { options }),
      this.episodeRepository.count({ contentId, statuses, searchKey, searchValue }),
    ]);

    return { items: episodes.map((e) => e.toInstance(EpisodeResponseDto)), total };
  }

  async retrieve({ contentId, id }: { contentId: number; id: number }) {
    const [episode] = await this.episodeRepository.find({ contentId, id }, { relations: { cuts: { lines: true } } });

    if (!episode) {
      throw new BadRequestException('존재하지 않는 회차입니다.', {
        cause: '존재하지 않는 회차입니다.',
      });
    }

    return episode.toInstance(EpisodeResponseDto);
  }

  @Transactional()
  async update({
    id,
    contentId,
    title,
    chapter,
    status,
  }: {
    id: number;
    contentId: number;
    title?: string;
    chapter?: number;
    status?: EpisodeStatus;
  }) {
    const [episode] = await this.episodeRepository.find({ id, contentId });

    if (!episode) {
      throw new BadRequestException('존재하지 않는 회차입니다.', {
        cause: '존재하지 않는 회차입니다.',
      });
    }

    if (chapter && chapter > 0) {
      const [existingEpisode] = await this.episodeRepository.find({ contentId, chapter });
      if (existingEpisode) {
        throw new BadRequestException('이미 등록된 회차입니다.', { cause: '이미 등록된 회차입니다.' });
      }
    }

    // 상태 변경은 허용 전이만(반려 포함). 기본 정보는 별도 수정.
    if (status !== undefined) {
      episode.transitionTo(status);
    }
    episode.update({ title, chapter });

    await this.episodeRepository.save([episode]);
  }

  @Transactional()
  async uploadScript({
    id,
    contentId,
    cutItems,
  }: {
    id: number;
    contentId: number;
    cutItems: {
      id?: number;
      position: number;
      imageUrl: string;
      lineItems: { id?: number; characterId: number; script: string; position: number }[];
    }[];
  }) {
    const [episode] = await this.episodeRepository.find({ id, contentId }, { relations: { cuts: { lines: true } } });

    if (!episode) {
      throw new BadRequestException('존재하지 않는 회차입니다.', {
        cause: '존재하지 않는 회차입니다.',
      });
    }
    const characterIds = new Set(cutItems.flatMap((cut) => cut.lineItems.map((line) => line.characterId)));

    const characters = await this.characterRepository.find({ ids: [...characterIds], contentId });

    if (characters.length !== characterIds.size) {
      throw new BadRequestException('존재하지 않는 캐릭터입니다.', {
        cause: '존재하지 않는 캐릭터입니다.',
      });
    }

    episode.uploadCut({ cutItems });

    await this.episodeRepository.save([episode]);
  }
}
