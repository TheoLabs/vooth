import { Controller, Get, UseGuards } from '@nestjs/common';
import { CreatorGuard } from '@common/guards';
import { Context, ContextKey } from '@common/context';
import { Account } from '@modules/account/domain/account.entity';
import { CreatorService } from '../applications/creator.service';

@Controller('creators/me')
@UseGuards(CreatorGuard)
export class CreatorMeController {
  constructor(
    private readonly creatorService: CreatorService,
    private readonly context: Context
  ) {}

  @Get()
  async me() {
    // 1. Destructure body, params, query
    // 2. Get context
    const account = this.context.get<Account>(ContextKey.ACCOUNT);

    // 3. Get result
    const data = await this.creatorService.getMyProfile({ accountId: account.id });

    // 4. Send response
    return { data };
  }
}
