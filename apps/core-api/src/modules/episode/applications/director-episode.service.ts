import { DddService } from '@libs/ddd';
import { BadRequestException, Injectable } from '@nestjs/common';
import { Transactional } from '@libs/decorators';
import { ContentRepository } from '@modules/content/infrastructure/content.repository';
import { CharacterRepository } from '@modules/character/infrastructure/character.repository';
import { EpisodeRepository } from '../infrastructure/episode.repository';
import { EpisodeResponseDto } from '../presentation/dto';
import { PaginationOptions } from '@libs/utils';
import { EpisodeStatus } from '@vooth/shared';

@Injectable()
export class DirectorEpisodeService extends DddService {
  constructor(
    private readonly episodeRepository: EpisodeRepository,
    private readonly contentRepository: ContentRepository,
    private readonly characterRepository: CharacterRepository
  ) {
    super();
  }

  async list({ contentId }: { contentId?: number }, options?: PaginationOptions) {
    const statuses = [
      EpisodeStatus.READY,
      EpisodeStatus.RECORDING,
      EpisodeStatus.REVIEWING,
      EpisodeStatus.PUBLISHED,
    ];
    const [episodes, total] = await Promise.all([
      this.episodeRepository.find({ contentId, statuses }, { options }),
      this.episodeRepository.count({ contentId, statuses }),
    ]);

    return { items: episodes, total };
  }

  async getStatsCount({ contentId }: { contentId: number }) {
    // NOTE: 회차 단위 APPROVED 제거됨 — '검수 완료(승인)' 집계는 (회차×성우) EpisodeReview 기준으로
    // 재작성 필요. 지금은 episode.status 롤업만 제공(approved 는 EpisodeReview 연동 시 대체).
    const [total, reviewing, ready] = await Promise.all([
      this.episodeRepository.count({ contentId }),
      this.episodeRepository.count({ contentId, statuses: [EpisodeStatus.REVIEWING] }),
      this.episodeRepository.count({ contentId, statuses: [EpisodeStatus.RECORDING, EpisodeStatus.READY] }),
    ]);

    return { total, approved: 0, reviewing, ready };
  }

  async retrieve({ id }: { id: number }) {
    const [episode] = await this.episodeRepository.find({ id }, { relations: { cuts: { lines: true } } });

    if (!episode) {
      throw new BadRequestException('존재하지 않는 회차입니다.', { cause: '존재하지 않는 회차입니다.' });
    }

    const [content] = await this.contentRepository.find({ id: episode.contentId });
    const characters = await this.characterRepository.find({ contentId: episode.contentId });

    return {
      episode: episode.toInstance(EpisodeResponseDto),
      contentTitle: content?.title ?? '',
      characters: characters.map((c) => ({ id: c.id, name: c.name })),
    };
  }

  @Transactional()
  async saveDirection({
    id,
    cuts,
  }: {
    id: number;
    cuts: { id: number; holdMs?: number; lines?: { id: number; anchorY?: number; gapBeforeMs?: number }[] }[];
  }) {
    const [episode] = await this.episodeRepository.find({ id }, { relations: { cuts: { lines: true } } });

    if (!episode) {
      throw new BadRequestException('존재하지 않는 회차입니다.', { cause: '존재하지 않는 회차입니다.' });
    }

    episode.applyDirection({ cuts });

    await this.episodeRepository.save([episode]);
  }
}
