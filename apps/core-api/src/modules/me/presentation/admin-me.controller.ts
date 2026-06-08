import { Context, ContextKey } from '@common/context';
import { AdminGuard } from '@common/guards';
import { Account } from '@modules/account/domain/account.entity';
import { Controller, Get, UseGuards } from '@nestjs/common';

@Controller('admins/me')
@UseGuards(AdminGuard)
export class AdminMeController {
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
