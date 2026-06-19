import { DddRepository } from '@libs/ddd';
import { Injectable } from '@nestjs/common';
import { Cut } from '../domain/cut.entity';
import { convertOptions, stripUndefined, TypeormRelationOptions } from '@libs/utils';

@Injectable()
export class CutRepository extends DddRepository<Cut> {
  entityClass = Cut;

  async find(conditions: { id?: number; episodeId?: number; order?: number }, options?: TypeormRelationOptions<Cut>) {
    return this.entityManager.find(this.entityClass, {
      where: stripUndefined({
        id: conditions.id,
        episodeId: conditions.episodeId,
        order: conditions.order,
      }),
      ...convertOptions(options),
    });
  }

  async count(conditions: { id?: number; episodeId?: number; order?: number }) {
    return this.entityManager.count(this.entityClass, {
      where: stripUndefined({
        id: conditions.id,
        episodeId: conditions.episodeId,
        order: conditions.order,
      }),
    });
  }
}
