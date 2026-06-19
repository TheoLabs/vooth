import { DddRepository } from '@libs/ddd';
import { Injectable } from '@nestjs/common';
import { Casting } from '../domain/casting.entity';
import { convertOptions, stripUndefined, TypeormRelationOptions } from '@libs/utils';

@Injectable()
export class CastingRepository extends DddRepository<Casting> {
  entityClass = Casting;

  async find(
    conditions: { id?: number; contentId?: number; characterId?: number; isPublished?: boolean; creatorId?: number },
    options?: TypeormRelationOptions<Casting>
  ) {
    return this.entityManager.find(this.entityClass, {
      where: stripUndefined({
        id: conditions.id,
        contentId: conditions.contentId,
        characterId: conditions.characterId,
        isPublished: conditions.isPublished,
        creatorId: conditions.creatorId,
      }),
      ...convertOptions(options),
    });
  }

  async count(conditions: {
    id?: number;
    contentId?: number;
    characterId?: number;
    isPublished?: boolean;
    creatorId?: number;
  }) {
    return this.entityManager.count(this.entityClass, {
      where: stripUndefined({
        id: conditions.id,
        contentId: conditions.contentId,
        characterId: conditions.characterId,
        isPublished: conditions.isPublished,
        creatorId: conditions.creatorId,
      }),
    });
  }

  async remove(castings: Casting[]) {
    return this.entityManager.remove(this.entityClass, castings);
  }
}
