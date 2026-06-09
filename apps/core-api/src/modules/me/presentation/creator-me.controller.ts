import { Context, ContextKey } from '@common/context';
import { CreatorGuard } from '@common/guards';
import { Account } from '@modules/account/domain/account.entity';
import { Controller, Get, UseGuards } from '@nestjs/common';

@Controller('creators/me')
@UseGuards(CreatorGuard)
export class CreatorMeController {
  constructor(private readonly context: Context) {}

  @Get()
  self() {
    // 1. Destructure body, params, query
    const user = this.context.get<Account>(ContextKey.ACCOUNT);

    // 2. Get context
    // 3. Get result
    // 4. Send response

    return { data: user };
  }
}
