import { Module } from '@nestjs/common';
import { AccountRepository } from './infrastructure/account.repository';
import { AdminAccountController } from './presentation/admin-account.controller';
import { AdminAccountService } from './applications/admin-account.service';

@Module({
  imports: [],
  controllers: [AdminAccountController],
  providers: [AccountRepository, AdminAccountService],
  exports: [AccountRepository, AdminAccountService],
})
export class AccountModule {}
