import { DddService } from '@libs/ddd';
import { Injectable } from '@nestjs/common';
import { AccountRepository } from '../infrastructure/account.repository';
import { PaginationOptions } from '@libs/utils';

@Injectable()
export class AdminAccountService extends DddService {
  constructor(private readonly accountRepository: AccountRepository) {
    super();
  }

  async list({ searchKey, searchValue }: { searchKey?: string; searchValue?: string }, options?: PaginationOptions) {
    const [accounts, total] = await Promise.all([
      this.accountRepository.find({ searchKey, searchValue }, { options }),
      this.accountRepository.count({ searchKey, searchValue }),
    ]);

    return { accounts, total };
  }
}
