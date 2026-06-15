import { DddRepository } from '@libs/ddd';
import { Injectable } from '@nestjs/common';
import { LineTake } from '../domain/line-take.entity';
import { convertOptions, stripUndefined, TypeormRelationOptions } from '@libs/utils';

@Injectable()
export class LineTakeRepository extends DddRepository<LineTake> {
  entityClass = LineTake;

  async find(
    conditions: { id?: number; lineId?: number; episodeId?: number; creatorId?: number },
    options?: TypeormRelationOptions<LineTake>
  ) {
    return this.entityManager.find(this.entityClass, {
      where: stripUndefined({
        id: conditions.id,
        lineId: conditions.lineId,
        episodeId: conditions.episodeId,
        creatorId: conditions.creatorId,
      }),
      ...convertOptions(options),
    });
  }

  /** 채택 해제(하드 삭제 — soft-delete 는 UNIQUE(lineId,creatorId) 재채택과 충돌). */
  async remove(conditions: { lineId: number; creatorId: number }) {
    await this.entityManager.delete(this.entityClass, {
      lineId: conditions.lineId,
      creatorId: conditions.creatorId,
    });
  }
}
