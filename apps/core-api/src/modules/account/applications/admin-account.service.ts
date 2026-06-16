import { DddService } from '@libs/ddd';
import { BadRequestException, Injectable } from '@nestjs/common';
import { AccountRepository } from '../infrastructure/account.repository';
import { PaginationOptions } from '@libs/utils';
import { Transactional } from '@libs/decorators';
import { RoleRepository } from '@modules/role/infrastructure/role.repository';
import { AccountStatus, AccountType } from '@vooth/shared';
import { Account } from '../domain/account.entity';
import { AccountResponseDto } from '../presentation/dto';

@Injectable()
export class AdminAccountService extends DddService {
  constructor(
    private readonly accountRepository: AccountRepository,
    private readonly roleRepository: RoleRepository
  ) {
    super();
  }

  async list(
    {
      searchKey,
      searchValue,
      statuses,
      types,
    }: {
      searchKey?: string;
      searchValue?: string;
      statuses?: AccountStatus[];
      types?: AccountType[];
    },
    options?: PaginationOptions
  ) {
    const [accounts, total] = await Promise.all([
      this.accountRepository.find({ searchKey, searchValue, statuses, types }, { options, relations: { role: true } }),
      this.accountRepository.count({ searchKey, searchValue, statuses, types }),
    ]);

    return { items: accounts.map((a) => a.toInstance(AccountResponseDto)), total };
  }

  async retrieve({ id }: { id: number }) {
    const [account] = await this.accountRepository.find({ ids: [id] }, { relations: { role: true } });

    if (!account) {
      throw new BadRequestException('존재하지 않는 계정입니다.', { cause: '존재하지 않는 계정입니다.' });
    }

    return account.toInstance(AccountResponseDto);
  }

  @Transactional()
  async changeRole({ account, id, roleId }: { account: Account; id: number; roleId: number }) {
    if (account.id === id) {
      throw new BadRequestException('자신의 계정은 변경할 수 없습니다.', {
        cause: '자신의 계정은 변경할 수 없습니다.',
      });
    }

    const [[targetAccount], [role]] = await Promise.all([
      this.accountRepository.find({ ids: [id] }),
      this.roleRepository.find({ ids: [roleId] }),
    ]);

    if (!targetAccount) {
      throw new BadRequestException('존재하지 않는 계정입니다.', { cause: '존재하지 않는 계정입니다.' });
    }

    if (!role) {
      throw new BadRequestException('존재하지 않는 역할입니다.', { cause: '존재하지 않는 역할입니다.' });
    }

    targetAccount.changeRole(roleId);
    await this.accountRepository.save([targetAccount]);
  }

  @Transactional()
  async reject({ id }: { id: number }) {
    const [account] = await this.accountRepository.find({ ids: [id] });

    if (!account) {
      throw new BadRequestException('존재하지 않는 계정입니다.', { cause: '존재하지 않는 계정입니다.' });
    }

    account.reject();
    await this.accountRepository.save([account]);
  }

  @Transactional()
  async active({ id, roleId }: { id: number; roleId: number }) {
    const [[account], [role]] = await Promise.all([
      this.accountRepository.find({ ids: [id] }),
      this.roleRepository.find({ ids: [roleId] }),
    ]);

    if (!account) {
      throw new BadRequestException('존재하지 않는 계정입니다.', { cause: '존재하지 않는 계정입니다.' });
    }

    if (!role) {
      throw new BadRequestException('존재하지 않는 역할입니다.', { cause: '존재하지 않는 역할입니다.' });
    }

    account.active(role.id);

    await this.accountRepository.save([account]);
  }

  @Transactional()
  async exit({ account, id }: { account: Account; id: number }) {
    if (account.id === id) {
      throw new BadRequestException('자신의 계정은 탈퇴할 수 없습니다.', {
        cause: '자신의 계정은 탈퇴할 수 없습니다.',
      });
    }

    const [targetAccount] = await this.accountRepository.find({ ids: [id] });

    if (!targetAccount) {
      throw new BadRequestException('존재하지 않는 계정입니다.', { cause: '존재하지 않는 계정입니다.' });
    }

    targetAccount.exit();
    await this.accountRepository.save([targetAccount]);
  }
}
