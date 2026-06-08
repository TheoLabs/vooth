import { AdminGuard } from '@common/guards';
import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AdminAccountService } from '../applications/admin-account.service';
import { AccountQueryDto } from './dto';

@Controller('admins/accounts')
@UseGuards(AdminGuard)
export class AdminAccountController {
  constructor(private readonly adminAccountService: AdminAccountService) {}

  @Get()
  async list(@Query() query: AccountQueryDto) {
    // 1. Destructure body, params, query
    const { searchKey, searchValue, ...options } = query;

    // 2. Get context
    // 3. Get result
    const data = await this.adminAccountService.list({ searchKey, searchValue }, options);

    // 4. Send response
    return { data };
  }
}
