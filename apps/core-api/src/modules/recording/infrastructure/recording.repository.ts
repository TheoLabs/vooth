import { DddRepository } from '@libs/ddd';
import { Injectable } from '@nestjs/common';
import { Recording } from '../domain/recording.entity';
import { checkInValue, convertOptions, stripUndefined, TypeormRelationOptions } from '@libs/utils';

@Injectable()
export class RecordingRepository extends DddRepository<Recording> {
  entityClass = Recording;

  async find(
    conditions: { ids?: number[]; castingIds?: number[]; lineIds?: number[]; creatorId?: number; isAdopted?: boolean },
    options?: TypeormRelationOptions<Recording>
  ) {
    return this.entityManager.find(this.entityClass, {
      where: stripUndefined({
        id: checkInValue(conditions.ids),
        castingId: checkInValue(conditions.castingIds),
        lineId: checkInValue(conditions.lineIds),
        creatorId: conditions.creatorId,
        isAdopted: conditions.isAdopted,
      }),
      ...convertOptions(options),
    });
  }

  async count(conditions: {
    ids?: number[];
    castingIds?: number[];
    lineIds?: number[];
    creatorId?: number;
    isAdopted?: boolean;
  }) {
    return this.entityManager.count(this.entityClass, {
      where: stripUndefined({
        id: checkInValue(conditions.ids),
        castingId: checkInValue(conditions.castingIds),
        lineId: checkInValue(conditions.lineIds),
        creatorId: conditions.creatorId,
        isAdopted: conditions.isAdopted,
      }),
    });
  }
}
