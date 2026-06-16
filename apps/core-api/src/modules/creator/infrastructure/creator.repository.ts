import { DddRepository } from '@libs/ddd';
import { Injectable } from '@nestjs/common';
import { Creator } from '../domain/creator.entity';
import { convertOptions, stripUndefined, TypeormRelationOptions } from '@libs/utils';

@Injectable()
export class CreatorRepository extends DddRepository<Creator> {
  entityClass = Creator;

  async find(conditions: { id: number; accountId?: number }, options?: TypeormRelationOptions<Creator>) {
    return this.entityManager.find(this.entityClass, {
      where: stripUndefined({
        id: conditions.id,
        accountId: conditions.accountId,
      }),
      ...convertOptions(options),
    });
  }

  async count(conditions: { id: number; accountId?: number }) {
    return this.entityManager.count(this.entityClass, {
      where: stripUndefined({
        id: conditions.id,
        accountId: conditions.accountId,
      }),
    });
  }
}
