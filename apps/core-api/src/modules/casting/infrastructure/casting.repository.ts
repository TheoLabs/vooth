import { DddRepository } from '@libs/ddd';
import { convertOptions, stripUndefined, TypeormRelationOptions } from '@libs/utils';
import { Casting } from '@modules/casting/domain/casting.entity';
import { Injectable } from '@nestjs/common';

@Injectable()
export class CastingRepository extends DddRepository<Casting> {
  entityClass = Casting;

  async find(
    conditions: { id?: number; characterId?: number; creatorId?: number; contentId?: number },
    options?: TypeormRelationOptions<Casting>
  ) {
    return this.entityManager.find(this.entityClass, {
      where: stripUndefined({
        id: conditions.id,
        characterId: conditions.characterId,
        creatorId: conditions.creatorId,
        contentId: conditions.contentId,
      }),
      ...convertOptions(options),
    });
  }

  async count(conditions: { id?: number; characterId?: number; creatorId?: number; contentId?: number }) {
    return this.entityManager.count(this.entityClass, {
      where: stripUndefined({
        id: conditions.id,
        characterId: conditions.characterId,
        creatorId: conditions.creatorId,
        contentId: conditions.contentId,
      }),
    });
  }
}
