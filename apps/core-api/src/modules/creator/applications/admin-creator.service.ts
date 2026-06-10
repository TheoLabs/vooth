import { DddService } from '@libs/ddd';
import { Injectable } from '@nestjs/common';
import { CreatorRepository } from '../infrastructure/creator.repository';
import { EventHandler } from '@libs/decorators/event-handler.decorator';
import { AccountApprovedEvent } from '@modules/account/domain/events';
import { Transactional } from '@libs/decorators';
import { AccountRepository } from '@modules/account/infrastructure/account.repository';
import { AccountStatus, AccountType } from '@vooth/shared';
import { Creator } from '../domain/creator.entity';
import { PaginationOptions } from '@libs/utils';

@Injectable()
export class AdminCreatorService extends DddService {
  constructor(
    private readonly creatorRepository: CreatorRepository,
    private readonly accountRepository: AccountRepository
  ) {
    super();
  }

  async list({ searchKey, searchValue }: { searchKey?: string; searchValue?: string }, options?: PaginationOptions) {
    const [creators, total] = await Promise.all([
      this.creatorRepository.find({ searchKey, searchValue }, { options, relations: { account: true } }),
      this.creatorRepository.count({ searchKey, searchValue }),
    ]);

    return { items: creators, total };
  }

  @EventHandler(AccountApprovedEvent, { description: '계정이 승인되면 Type에 따라서 Creator 를 생성해준다.' })
  @Transactional()
  async handleAccountApprovedEvent(event: AccountApprovedEvent) {
    const { accountId } = event;

    const [[account], [exisitingCreator]] = await Promise.all([
      this.accountRepository.find({
        ids: [accountId],
        types: [AccountType.CREATOR],
        statuses: [AccountStatus.ACTIVE],
      }),
      this.creatorRepository.find({
        accountId,
      }),
    ]);

    if (account && !exisitingCreator) {
      const creator = Creator.of({ accountId });
      await this.creatorRepository.save([creator]);
    }
  }
}
