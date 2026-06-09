import { Module } from '@nestjs/common';
import { AccountRepository } from './infrastructure/account.repository';
import { AdminAccountController } from './presentation/admin-account.controller';
import { AdminAccountService } from './applications/admin-account.service';
import { RoleModule } from '@modules/role/role.module';

@Module({
  imports: [RoleModule],
  controllers: [AdminAccountController],
  providers: [AccountRepository, AdminAccountService],
  exports: [AccountRepository, AdminAccountService],
})
export class AccountModule {}
