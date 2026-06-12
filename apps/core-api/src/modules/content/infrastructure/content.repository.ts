import { DddRepository } from '@libs/ddd';
import { Injectable } from '@nestjs/common';
import { Content } from '../domain/content.entity';
import { checkInValue, checkLikeValue, convertOptions, stripUndefined, TypeormRelationOptions } from '@libs/utils';
import { ContentStatus } from '@vooth/shared';
import { ContentSpec } from '../domain/specs';

@Injectable()
export class ContentRepository extends DddRepository<Content> {
  entityClass = Content;

  async satifyElementFind(spec: ContentSpec, options: TypeormRelationOptions<Content>) {
    return spec.satisfyElementFind(this, options);
  }

  async satifyElementCount(spec: ContentSpec) {
    return spec.satisfyElementCount(this);
  }

  async find(
    conditions: {
      id?: number;
      title?: string;
      searchKey?: string;
      searchValue?: string;
      statuses?: ContentStatus[];
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
        ...checkLikeValue({ searchKey: conditions.searchKey, searchValue: conditions.searchValue }),
      }),
      ...convertOptions(options),
    });
  }

  async count(conditions: {
    id?: number;
    title?: string;
    searchKey?: string;
    searchValue?: string;
    statuses?: ContentStatus[];
    tagIds?: number[];
  }) {
    return this.entityManager.count(this.entityClass, {
      where: stripUndefined({
        id: conditions.id,
        title: conditions.title,
        status: checkInValue(conditions.statuses),
        tags: { id: checkInValue(conditions.tagIds) },
        ...checkLikeValue({ searchKey: conditions.searchKey, searchValue: conditions.searchValue }),
      }),
    });
  }
}
