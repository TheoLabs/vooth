import { DddRepository } from '@libs/ddd';
import { Injectable } from '@nestjs/common';
import { Content } from '../domain/content.entity';
import { ContentStatus } from '@vooth/shared';
import { checkInValue, checkLikeValue, convertOptions, stripUndefined, TypeormRelationOptions } from '@libs/utils';

@Injectable()
export class ContentRepository extends DddRepository<Content> {
  entityClass = Content;

  async find(
    conditions: {
      id?: number;
      title?: string;
      statuses?: ContentStatus[];
      searchKey?: string;
      searchValue?: string;
      tagIds?: number[];
    },
    options?: TypeormRelationOptions<Content>
  ) {
    return this.entityManager.find(this.entityClass, {
      where: stripUndefined({
        id: conditions.id,
        title: conditions.title,
        status: checkInValue(conditions.statuses),
        tags: { id: checkInValue(conditions.tagIds) },
        ...checkLikeValue({
          searchKey: conditions.searchKey,
          searchValue: conditions.searchValue,
        }),
      }),
      ...convertOptions(options),
    });
  }

  async count(conditions: {
    id?: number;
    title?: string;
    statuses?: ContentStatus[];
    searchKey?: string;
    searchValue?: string;
    tagIds?: number[];
  }) {
    return this.entityManager.count(this.entityClass, {
      where: stripUndefined({
        id: conditions.id,
        title: conditions.title,
        status: checkInValue(conditions.statuses),
        tags: { id: checkInValue(conditions.tagIds) },
        ...checkLikeValue({
          searchKey: conditions.searchKey,
          searchValue: conditions.searchValue,
        }),
      }),
    });
  }
}
