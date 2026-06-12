import { DddRepository } from '@libs/ddd';
import { Injectable } from '@nestjs/common';
import { Episode } from '../domain/episode.entity';
import { checkInValue, checkLikeValue, convertOptions, stripUndefined, TypeormRelationOptions } from '@libs/utils';
import { EpisodeStatus } from '@vooth/shared';
import { Line } from '../domain/line.entity';
import { Cut } from '../domain/cut.entity';
import { EpisodeSpec } from '../domain/specs';

@Injectable()
export class EpisodeRepository extends DddRepository<Episode> {
  entityClass = Episode;

  private entityCutClass = Cut;

  private entityLineClass = Line;

  async satifyElementFrom(spec: EpisodeSpec, options?: TypeormRelationOptions<Episode>) {
    return spec.satifyElementFrom(this, options);
  }

  async satifyCountFrom(spec: EpisodeSpec) {
    return spec.satifyCountFrom(this);
  }

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

  async findCuts(conditions: { ids?: number[]; episodeId?: number }, options?: TypeormRelationOptions<Cut>) {
    return this.entityManager.find(this.entityCutClass, {
      where: stripUndefined({
        id: checkInValue(conditions.ids),
        episodeId: conditions.episodeId,
      }),
      ...convertOptions(options),
    });
  }

  async countCuts(conditions: { ids?: number[]; episodeId?: number }) {
    return this.entityManager.count(this.entityCutClass, {
      where: stripUndefined({
        id: checkInValue(conditions.ids),
        episodeId: conditions.episodeId,
      }),
    });
  }

  async findLines(conditions: { id?: number; episodeId?: number }, options?: TypeormRelationOptions<Line>) {
    return this.entityManager.find(this.entityLineClass, {
      where: stripUndefined({
        id: conditions.id,
        episodeId: conditions.episodeId,
      }),
      ...convertOptions(options),
    });
  }

  async countLines(conditions: { id?: number; episodeId?: number }) {
    return this.entityManager.count(this.entityLineClass, {
      where: stripUndefined({
        id: conditions.id,
        episodeId: conditions.episodeId,
      }),
    });
  }
}
