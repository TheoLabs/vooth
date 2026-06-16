import { DddService } from '@libs/ddd';
import { Injectable } from '@nestjs/common';
import { CreatorRepository } from '../infrastructure/creator.repository';
import { FileService } from '@modules/file/applications/file.service';
import { Transactional } from '@libs/decorators';
import { EventHandler } from '@libs/decorators/event-handler.decorator';
import { AccountActivedEvent } from '@modules/account/domain/events';
import { AccountRepository } from '@modules/account/infrastructure/account.repository';
import { AccountType } from '@vooth/shared';
import { Creator } from '../domain/creator.entity';
import { PaginationOptions } from '@libs/utils';
import { AdminCreatorResponseDto } from '../presentation/dto';

@Injectable()
export class AdminCreatorService extends DddService {
  constructor(
    private readonly adminFileService: FileService,
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

    return { items: creators.map((c) => c.toInstance(AdminCreatorResponseDto)), total };
  }

  @EventHandler(AccountActivedEvent, { description: '크리에이터 계정이 생성되면 Creator도 함께 생성해준다.' })
  @Transactional()
  async handleAccountActivedEvent(event: AccountActivedEvent) {
    const { accountId } = event;

    const [[account], [creator]] = await Promise.all([
      this.accountRepository.find({ ids: [accountId], types: [AccountType.CREATOR] }),
      this.creatorRepository.find({ accountId }),
    ]);

    if (account && !creator) {
      const newCreator = Creator.of({ accountId, nickname: account.name });
      await this.creatorRepository.save([newCreator]);
    }
  }
}
