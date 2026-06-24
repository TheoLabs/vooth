import { DddRepository } from '@libs/ddd';
import { Injectable } from '@nestjs/common';
import { Content } from '../domain/content.entity';
import { ContentStatus } from '@vooth/shared';
import { checkInValue, checkLikeValue, convertOptions, stripUndefined, TypeormRelationOptions } from '@libs/utils';
import { ContentSpec } from '../domain/specs';

@Injectable()
export class ContentRepository extends DddRepository<Content> {
  entityClass = Content;

  async satisfyElementFrom(spec: ContentSpec, options?: TypeormRelationOptions<Content>) {
    return spec.satisfyElementFrom(this, options);
  }

  async satisfyCountFrom(spec: ContentSpec) {
    return spec.satisfyCountFrom(this);
  }

  async find(
    conditions: {
      ids?: number[];
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
        id: checkInValue(conditions.ids),
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
    ids?: number[];
    title?: string;
    statuses?: ContentStatus[];
    searchKey?: string;
    searchValue?: string;
    tagIds?: number[];
  }) {
    return this.entityManager.count(this.entityClass, {
      where: stripUndefined({
        id: checkInValue(conditions.ids),
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
