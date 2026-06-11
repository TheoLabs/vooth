import { Module } from '@nestjs/common';
import { CreatorRepository } from './infrastructure/creator.repository';
import { AdminCreatorService } from './applications/admin-creator.service';
import { AccountModule } from '@modules/account/account.module';
import { AdminCreatorController } from './presentation/admin-creator.controller';

@Module({
  imports: [AccountModule],
  controllers: [AdminCreatorController],
  providers: [CreatorRepository, AdminCreatorService],
  exports: [CreatorRepository, AdminCreatorService],
})
export class CreatorModule {}
