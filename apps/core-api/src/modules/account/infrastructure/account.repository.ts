import { DddRepository } from '@libs/ddd';
import { Injectable } from '@nestjs/common';
import { Account } from '../domain/account.entity';
import { checkInValue, checkLikeValue, convertOptions, stripUndefined, TypeormRelationOptions } from '@libs/utils';

@Injectable()
export class AccountRepository extends DddRepository<Account> {
  entityClass = Account;

  async find(
    conditions: { ids?: number[]; googleSub?: string; searchKey?: string; searchValue?: string },
    options?: TypeormRelationOptions<Account>
  ) {
    return this.entityManager.find(this.entityClass, {
      where: stripUndefined({
        id: checkInValue(conditions.ids),
        googleSub: conditions.googleSub,
        ...checkLikeValue({ searchKey: conditions.searchKey, searchValue: conditions.searchValue }),
      }),
      ...convertOptions(options),
    });
  }

  async count(conditions: { ids?: number[]; googleSub?: string; searchKey?: string; searchValue?: string }) {
    return this.entityManager.count(this.entityClass, {
      where: stripUndefined({
        id: checkInValue(conditions.ids),
        googleSub: conditions.googleSub,
        ...checkLikeValue({ searchKey: conditions.searchKey, searchValue: conditions.searchValue }),
      }),
    });
  }
}
