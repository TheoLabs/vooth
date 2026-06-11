import { DddRepository } from '@libs/ddd';
import { Injectable } from '@nestjs/common';
import { Episode } from '../domain/episode.entity';
import { checkInValue, checkLikeValue, convertOptions, stripUndefined, TypeormRelationOptions } from '@libs/utils';
import { EpisodeStatus } from '@vooth/shared';
import { Line } from '../domain/line.entity';

@Injectable()
export class EpisodeRepository extends DddRepository<Episode> {
  entityClass = Episode;

  async find(
    conditions: {
      id?: number;
      contentId?: number;
      chapter?: number;
      statuses?: EpisodeStatus[];
      searchKey?: string;
      searchValue?: string;
    },
    options?: TypeormRelationOptions<Episode>
  ) {
    return this.entityManager.find(this.entityClass, {
      where: stripUndefined({
        id: conditions.id,
        contentId: conditions.contentId,
        chapter: conditions.chapter,
        status: checkInValue(conditions.statuses),
        ...checkLikeValue({ searchKey: conditions.searchKey, searchValue: conditions.searchValue }),
      }),
      ...convertOptions(options),
    });
  }

  async count(conditions: {
    id?: number;
    contentId?: number;
    chapter?: number;
    statuses?: EpisodeStatus[];
    searchKey?: string;
    searchValue?: string;
  }) {
    return this.entityManager.count(this.entityClass, {
      where: stripUndefined({
        id: conditions.id,
        contentId: conditions.contentId,
        chapter: conditions.chapter,
        status: checkInValue(conditions.statuses),
        ...checkLikeValue({ searchKey: conditions.searchKey, searchValue: conditions.searchValue }),
      }),
    });
  }

  async findLines(conditions: { id?: number; episodeId?: number }, options?: TypeormRelationOptions<Line>) {
    return this.entityManager.find(Line, {
      where: stripUndefined({
        id: conditions.id,
        episodeId: conditions.episodeId,
      }),
      ...convertOptions(options),
    });
  }

  async countLines(conditions: { id?: number; episodeId?: number }) {
    return this.entityManager.count(Line, {
      where: stripUndefined({
        id: conditions.id,
        episodeId: conditions.episodeId,
      }),
    });
  }
}
