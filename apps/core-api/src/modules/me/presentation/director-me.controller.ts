import { Context, ContextKey } from '@common/context';
import { DirectorGuard } from '@common/guards';
import { Account } from '@modules/account/domain/account.entity';
import { Controller, Get, UseGuards } from '@nestjs/common';

@Controller('directors/me')
@UseGuards(DirectorGuard)
export class DirectorMeController {
  constructor(private readonly context: Context) {}

  @Get()
  self() {
    // 1. Destructure body, params, query
    // 2. Get context
    const user = this.context.get<Account>(ContextKey.ACCOUNT);

    // 3. Get result
    // 4. Send response

    return { data: user };
  }
}
