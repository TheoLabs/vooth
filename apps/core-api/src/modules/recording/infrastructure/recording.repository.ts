import { DddRepository } from '@libs/ddd';
import { Injectable } from '@nestjs/common';
import { Recording } from '../domain/recording.entity';
import { stripUndefined, TypeormRelationOptions, convertOptions } from '@libs/utils';

@Injectable()
export class RecordingRepository extends DddRepository<Recording> {
  entityClass = Recording;

  async find(
    conditions: { id?: number; episodeId?: number; creatorId?: number; lineId?: number; take?: number },
    options?: TypeormRelationOptions<Recording>
  ) {
    return this.entityManager.find(this.entityClass, {
      where: stripUndefined({
        id: conditions.id,
        episodeId: conditions.episodeId,
        creatorId: conditions.creatorId,
        lineId: conditions.lineId,
        take: conditions.take,
      }),
      ...convertOptions(options),
    });
  }

  async count(conditions: { id?: number; episodeId?: number; creatorId?: number; lineId?: number; take?: number }) {
    return this.entityManager.count(this.entityClass, {
      where: stripUndefined({
        id: conditions.id,
        episodeId: conditions.episodeId,
        creatorId: conditions.creatorId,
        lineId: conditions.lineId,
        take: conditions.take,
      }),
    });
  }
}
