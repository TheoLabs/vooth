import { DddRepository } from '@libs/ddd';
import { Injectable } from '@nestjs/common';
import { Role } from '../domain/role.entity';
import { checkInValue, checkLikeValue, convertOptions, stripUndefined, TypeormRelationOptions } from '@libs/utils';
import { RoleType } from '@vooth/shared';

@Injectable()
export class RoleRepository extends DddRepository<Role> {
  entityClass = Role;

  async find(
    conditions: { ids?: number[]; name?: string; type?: RoleType; searchKey?: string; searchValue?: string },
    options?: TypeormRelationOptions<Role>
  ) {
    return this.entityManager.find(this.entityClass, {
      where: stripUndefined({
        id: checkInValue(conditions.ids),
        name: conditions.name,
        type: conditions.type,
        ...checkLikeValue({ searchKey: conditions.searchKey, searchValue: conditions.searchValue }),
      }),
      ...convertOptions(options),
    });
  }

  async count(conditions: {
    ids?: number[];
    name?: string;
    type?: RoleType;
    searchKey?: string;
    searchValue?: string;
  }) {
    return this.entityManager.count(this.entityClass, {
      where: stripUndefined({
        id: checkInValue(conditions.ids),
        name: conditions.name,
        type: conditions.type,
        ...checkLikeValue({ searchKey: conditions.searchKey, searchValue: conditions.searchValue }),
      }),
    });
  }
}
