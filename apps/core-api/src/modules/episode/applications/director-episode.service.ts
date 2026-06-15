import keyBy from 'lodash/keyBy';
import uniq from 'lodash/uniq';
import { DddService } from '@libs/ddd';
import { BadRequestException, Injectable } from '@nestjs/common';
import { Transactional } from '@libs/decorators';
import { PaginationOptions } from '@libs/utils';
import { EpisodeStatus } from '@vooth/shared';
import { ContentRepository } from '@modules/content/infrastructure/content.repository';
import { CharacterRepository } from '@modules/character/infrastructure/character.repository';
import { EpisodeRepository } from '../infrastructure/episode.repository';
import { EpisodeResponseDto } from '../presentation/dto';

/**
 * 연출(vooth-tool) 표면. 인증/권한 없이 공개(임시).
 * - 회차 목록/상세(컷·대사 + 연출 필드 + 캐릭터명) 조회
 * - 연출 부분 저장(anchorY/gap/hold) — 스크립트 미변경(등록과 비충돌)
 */
@Injectable()
export class DirectorEpisodeService extends DddService {
  constructor(
    private readonly episodeRepository: EpisodeRepository,
    private readonly contentRepository: ContentRepository,
    private readonly characterRepository: CharacterRepository
  ) {
    super();
  }

  async list(
    { statuses, searchKey, searchValue }: { statuses?: EpisodeStatus[]; searchKey?: string; searchValue?: string },
    options?: PaginationOptions
  ) {
    const [episodes, total] = await Promise.all([
      this.episodeRepository.find({ statuses, searchKey, searchValue }, { options }),
      this.episodeRepository.count({ statuses, searchKey, searchValue }),
    ]);

    // 콘텐츠 제목 매핑(단일 id 조회만 가능 → unique id 만 모아 병렬 조회).
    const contentIds = uniq(episodes.map((e) => e.contentId));
    const contents = await Promise.all(contentIds.map((id) => this.contentRepository.find({ id }).then((r) => r[0])));
    const contentById = keyBy(contents.filter((c): c is NonNullable<typeof c> => Boolean(c)), 'id');

    const items = episodes.map((e) => ({
      id: e.id,
      contentId: e.contentId,
      contentTitle: contentById[e.contentId]?.title ?? '',
      chapter: e.chapter,
      title: e.title,
      status: e.status,
      cutCount: e.cutCount,
      lineCount: e.lineCount,
    }));

    return { items, total };
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
