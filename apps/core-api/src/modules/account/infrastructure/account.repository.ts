import { DddRepository } from '@libs/ddd';
import { Injectable } from '@nestjs/common';
import { Account } from '../domain/account.entity';

@Injectable()
export class AccountRepository extends DddRepository<Account> {
  entityClass = Account;
}
