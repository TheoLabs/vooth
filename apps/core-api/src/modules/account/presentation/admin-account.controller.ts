import { AdminGuard } from '@common/guards';
import { Body, Controller, Get, Param, ParseIntPipe, Put, Query, UseGuards } from '@nestjs/common';
import { AdminAccountService } from '../applications/admin-account.service';
import { AccountQueryDto, AccountApproveDto, AccountChangeRoleDto } from './dto';
import { Context, ContextKey } from '@common/context';
import { Account } from '../domain/account.entity';

@Controller('admins/accounts')
@UseGuards(AdminGuard)
export class AdminAccountController {
  constructor(
    private readonly adminAccountService: AdminAccountService,
    private readonly context: Context
  ) {}

  @Get()
  async list(@Query() query: AccountQueryDto) {
    // 1. Destructure body, params, query
    const { searchKey, searchValue, statuses, types, ...options } = query;

    // 2. Get context
    // 3. Get result
    const data = await this.adminAccountService.list({ searchKey, searchValue, statuses, types }, options);

    // 4. Send response
    return { data };
  }

  @Get(':id')
  async retrieve(@Param('id', ParseIntPipe) id: number) {
    // 1. Destructure body, params, query
    // 2. Get context
    // 3. Get result
    const data = await this.adminAccountService.retrieve({ id });

    // 4. Send response
    return { data };
  }

  @Put(':id/roles')
  async changeRole(@Param('id', ParseIntPipe) id: number, @Body() body: AccountChangeRoleDto) {
    // 1. Destructure body, params, query
    // 2. Get context
    const account = this.context.get<Account>(ContextKey.ACCOUNT);

    // 3. Get result
    await this.adminAccountService.changeRole({ account, id, ...body });

    // 4. Send response
    return { data: {} };
  }

  @Put(':id/approve')
  async active(@Param('id', ParseIntPipe) id: number, @Body() body: AccountApproveDto) {
    // 1. Destructure body, params, query
    // 2. Get context
    // 3. Get result
    await this.adminAccountService.active({ id, ...body });

    // 4. Send response
    return { data: {} };
  }

  @Put(':id/reject')
  async reject(@Param('id', ParseIntPipe) id: number) {
    // 1. Destructure body, params, query
    // 2. Get context
    // 3. Get result
    await this.adminAccountService.reject({ id });

    // 4. Send response
    return { data: {} };
  }

  @Put(':id/exit')
  async exit(@Param('id', ParseIntPipe) id: number) {
    // 1. Destructure body, params, query
    // 2. Get context
    const account = this.context.get<Account>(ContextKey.ACCOUNT);

    // 3. Get result
    await this.adminAccountService.exit({ account, id });

    // 4. Send response
    return { data: {} };
  }
}
