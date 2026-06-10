import { DddRepository } from '@libs/ddd';
import { Injectable } from '@nestjs/common';
import { Content } from '../domain/content.entity';
import { checkInValue, checkLikeValue, convertOptions, stripUndefined, TypeormRelationOptions } from '@libs/utils';
import { ContentStatus } from '@vooth/shared';

@Injectable()
export class ContentRepository extends DddRepository<Content> {
  entityClass = Content;

  async find(
    conditions: { id?: number; searchKey?: string; searchValue?: string; statuses?: ContentStatus[] },
    options?: TypeormRelationOptions<Content>
  ) {
    return this.entityManager.find(this.entityClass, {
      where: stripUndefined({
        id: conditions.id,
        status: checkInValue(conditions.statuses),
        ...checkLikeValue({ searchKey: conditions.searchKey, searchValue: conditions.searchValue }),
      }),
      ...convertOptions(options),
    });
  }

  async count(conditions: { id?: number; searchKey?: string; searchValue?: string; statuses?: ContentStatus[] }) {
    return this.entityManager.count(this.entityClass, {
      where: stripUndefined({
        id: conditions.id,
        status: checkInValue(conditions.statuses),
        ...checkLikeValue({ searchKey: conditions.searchKey, searchValue: conditions.searchValue }),
      }),
    });
  }
}
