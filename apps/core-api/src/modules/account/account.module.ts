import { Module } from '@nestjs/common';
import { AccountRepository } from './infrastructure/account.repository';

@Module({
  imports: [],
  controllers: [],
  providers: [AccountRepository],
  exports: [AccountRepository],
})
export class AccountModule {}
