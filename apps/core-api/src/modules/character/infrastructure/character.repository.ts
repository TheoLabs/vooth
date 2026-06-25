import { DddRepository } from '@libs/ddd';
import { Injectable } from '@nestjs/common';
import { Character } from '../domain/character.entity';
import { checkInValue, checkLikeValue, convertOptions, stripUndefined, TypeormRelationOptions } from '@libs/utils';
import { CharacterType } from '@vooth/shared';

@Injectable()
export class CharacterRepository extends DddRepository<Character> {
  entityClass = Character;

  async find(
    conditions: {
      ids?: number[];
      name?: string;
      contentId?: number;
      types?: CharacterType[];
      searchKey?: string;
      searchValue?: string;
    },
    options?: TypeormRelationOptions<Character>
  ) {
    return this.entityManager.find(this.entityClass, {
      where: stripUndefined({
        id: checkInValue(conditions.ids),
        contentId: conditions.contentId,
        name: conditions.name,
        type: checkInValue(conditions.types),
        ...checkLikeValue({ searchKey: conditions.searchKey, searchValue: conditions.searchValue }),
      }),
      ...convertOptions(options),
    });
  }

  async count(conditions: {
    ids?: number[];
    name?: string;
    contentId?: number;
    types?: CharacterType[];
    searchKey?: string;
    searchValue?: string;
  }) {
    return this.entityManager.count(this.entityClass, {
      where: stripUndefined({
        id: checkInValue(conditions.ids),
        contentId: conditions.contentId,
        name: conditions.name,
        type: checkInValue(conditions.types),
        ...checkLikeValue({ searchKey: conditions.searchKey, searchValue: conditions.searchValue }),
      }),
    });
  }
}
