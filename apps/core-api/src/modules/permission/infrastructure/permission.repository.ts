import { DddRepository } from '@libs/ddd';
import { Injectable } from '@nestjs/common';
import { Permission } from '../domain/permission.entity';
import { checkInValue, checkLikeValue, convertOptions, stripUndefined, TypeormRelationOptions } from '@libs/utils';
import { PermissionCategory } from '@vooth/shared';

@Injectable()
export class PermissionRepository extends DddRepository<Permission> {
  entityClass = Permission;

  async find(
    conditions: { codes?: string[]; categories?: PermissionCategory[]; searchKey?: string; searchValue?: string },
    options?: TypeormRelationOptions<Permission>
  ) {
    return this.entityManager.find(this.entityClass, {
      where: stripUndefined({
        code: checkInValue(conditions.codes),
        category: checkInValue(conditions.categories),
        ...checkLikeValue({ searchKey: conditions.searchKey, searchValue: conditions.searchValue }),
      }),
      ...convertOptions(options),
    });
  }

  async count(conditions: {
    codes?: string[];
    categories?: PermissionCategory[];
    searchKey?: string;
    searchValue?: string;
  }) {
    return this.entityManager.count(this.entityClass, {
      where: stripUndefined({
        code: checkInValue(conditions.codes),
        category: checkInValue(conditions.categories),
        ...checkLikeValue({ searchKey: conditions.searchKey, searchValue: conditions.searchValue }),
      }),
    });
  }
}
