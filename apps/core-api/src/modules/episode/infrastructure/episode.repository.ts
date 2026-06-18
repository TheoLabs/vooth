import { DddRepository } from '@libs/ddd';
import { Injectable } from '@nestjs/common';
import { Episode } from '../domain/episode.entity';
import {
  checkInValue,
  checkLikeValue,
  checkRangeValue,
  convertOptions,
  stripUndefined,
  TypeormRelationOptions,
} from '@libs/utils';
import { CalendarDate, EpisodeStatus } from '@vooth/shared';

@Injectable()
export class EpisodeRepository extends DddRepository<Episode> {
  entityClass = Episode;

  async find(
    conditions: {
      id?: number;
      contentId?: number;
      statuses?: EpisodeStatus[];
      chapter?: number;
      searchKey?: string;
      searchValue?: string;
      isFree?: boolean;
      minExpectedPublishOn?: CalendarDate;
      maxExpectedPublishOn?: CalendarDate;
    },
    options?: TypeormRelationOptions<Episode>
  ) {
    return this.entityManager.find(this.entityClass, {
      where: stripUndefined({
        id: conditions.id,
        contentId: conditions.contentId,
        status: checkInValue(conditions.statuses),
        chapter: conditions.chapter,
        isFree: conditions.isFree,
        expectedPublishOn: checkRangeValue(conditions.minExpectedPublishOn, conditions.maxExpectedPublishOn),
        ...checkLikeValue({ searchKey: conditions.searchKey, searchValue: conditions.searchValue }),
      }),
      ...convertOptions(options),
    });
  }

  async count(conditions: {
    id?: number;
    contentId?: number;
    statuses?: EpisodeStatus[];
    chapter?: number;
    searchKey?: string;
    searchValue?: string;
    isFree?: boolean;
    minExpectedPublishOn?: CalendarDate;
    maxExpectedPublishOn?: CalendarDate;
  }) {
    return this.entityManager.count(this.entityClass, {
      where: stripUndefined({
        id: conditions.id,
        contentId: conditions.contentId,
        status: checkInValue(conditions.statuses),
        chapter: conditions.chapter,
        isFree: conditions.isFree,
        expectedPublishOn: checkRangeValue(conditions.minExpectedPublishOn, conditions.maxExpectedPublishOn),
        ...checkLikeValue({ searchKey: conditions.searchKey, searchValue: conditions.searchValue }),
      }),
    });
  }
}
