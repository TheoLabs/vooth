import { DddRepository } from '@libs/ddd';
import { Injectable } from '@nestjs/common';
import { Recording } from '../domain/recording.entity';
import { stripUndefined, TypeormRelationOptions, convertOptions } from '@libs/utils';

@Injectable()
export class RecordingRepository extends DddRepository<Recording> {
  entityClass = Recording;

  async find(
    conditions: { id?: number; episodeId?: number; creatorId?: number },
    options?: TypeormRelationOptions<Recording>
  ) {
    return this.entityManager.find(this.entityClass, {
      where: stripUndefined({
        id: conditions.id,
        episodeId: conditions.episodeId,
        creatorId: conditions.creatorId,
      }),
      ...convertOptions(options),
    });
  }

  async count(conditions: { id?: number; episodeId?: number; creatorId?: number }) {
    return this.entityManager.count(this.entityClass, {
      where: stripUndefined({
        id: conditions.id,
        episodeId: conditions.episodeId,
        creatorId: conditions.creatorId,
      }),
    });
  }
}
