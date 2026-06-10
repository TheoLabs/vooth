import { Module } from '@nestjs/common';
import { CreatorRepository } from './infrastructure/creator.repository';
import { AdminCreatorService } from './applications/admin-creator.service';
import { AccountModule } from '@modules/account/account.module';

@Module({
  imports: [AccountModule],
  controllers: [],
  providers: [CreatorRepository, AdminCreatorService],
  exports: [CreatorRepository, AdminCreatorService],
})
export class CreatorModule {}
