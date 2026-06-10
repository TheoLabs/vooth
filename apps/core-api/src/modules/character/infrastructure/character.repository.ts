import { DddRepository } from '@libs/ddd';
import { Injectable } from '@nestjs/common';
import { Character } from '../domain/character.entity';
import { checkInValue, convertOptions, stripUndefined, TypeormRelationOptions } from '@libs/utils';
import { CharacterType } from '@vooth/shared';

@Injectable()
export class CharacterRepository extends DddRepository<Character> {
  entityClass = Character;

  async find(
    conditions: { id?: number; contentId?: number; name?: string; types?: CharacterType[] },
    options?: TypeormRelationOptions<Character>
  ) {
    return this.entityManager.find(this.entityClass, {
      where: stripUndefined({
        id: conditions.id,
        contentId: conditions.contentId,
        name: conditions.name,
        type: checkInValue(conditions.types),
      }),
      ...convertOptions(options),
    });
  }

  async count(conditions: { id?: number; contentId?: number; name?: string; types?: CharacterType[] }) {
    return this.entityManager.count(this.entityClass, {
      where: stripUndefined({
        id: conditions.id,
        contentId: conditions.contentId,
        name: conditions.name,
        type: checkInValue(conditions.types),
      }),
    });
  }
}
