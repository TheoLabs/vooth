import { DddRepository } from '@libs/ddd';
import { Injectable } from '@nestjs/common';
import { Episode } from '../domain/episode.entity';
import {
  applyPagination,
  checkInValue,
  checkLikeValue,
  checkRangeValue,
  convertOptions,
  PaginationOptions,
  stripUndefined,
  TypeormRelationOptions,
} from '@libs/utils';
import { CalendarDate, EpisodeStatus } from '@vooth/shared';
import { Content } from '@modules/content/domain/content.entity';
import { Brackets } from 'typeorm';

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

  /**
   * 일단 레퍼런스로 놔둠. 현재 사용하지는 않음.
   */
  private async findAndCountWithContent(
    conditions: {
      searchValue?: string;
      statuses?: EpisodeStatus[];
    },
    options?: PaginationOptions
  ) {
    const query = this.createQueryBuilder('episode').leftJoinAndMapOne(
      'episode.content',
      Content,
      'content',
      'content.id = episode.contentId'
    );

    if (conditions.statuses && conditions.statuses.length > 0) {
      query.andWhere('episode.status IN (:...statuses)', { statuses: conditions.statuses });
    }

    if (conditions.searchValue) {
      const value = `%${conditions.searchValue}%`;
      query.andWhere(
        new Brackets((qb) => {
          qb.where('episode.title LIKE :value', { value });
          qb.orWhere('content.title LIKE :value', { value });
        })
      );
    }

    applyPagination(query, options);
    return query.getManyAndCount();
  }
}
