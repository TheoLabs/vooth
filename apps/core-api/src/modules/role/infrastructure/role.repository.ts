import { DddRepository } from '@libs/ddd';
import { Injectable } from '@nestjs/common';
import { Role } from '../domain/role.entity';
import { checkInValue, convertOptions, stripUndefined, TypeormRelationOptions } from '@libs/utils';

@Injectable()
export class RoleRepository extends DddRepository<Role> {
  entityClass = Role;

  async find(conditions: { ids?: number[] }, options: TypeormRelationOptions<Role>) {
    return this.entityManager.find(this.entityClass, {
      where: stripUndefined({
        id: checkInValue(conditions.ids),
      }),
      ...convertOptions(options),
    });
  }

  async count(conditions: { ids?: number[] }) {
    return this.entityManager.count(this.entityClass, {
      where: stripUndefined({
        id: checkInValue(conditions.ids),
      }),
    });
  }
}
