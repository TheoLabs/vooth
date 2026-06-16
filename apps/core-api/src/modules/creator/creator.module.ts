import { FileModule } from '@modules/file/file.module';
import { Module } from '@nestjs/common';
import { CreatorRepository } from './infrastructure/creator.repository';
import { AccountModule } from '@modules/account/account.module';
import { AdminCreatorService } from './applications/admin-creator.service';
import { AdminCreatorController } from './presentation/admin-creator.controller';

@Module({
  imports: [FileModule, AccountModule],
  controllers: [AdminCreatorController],
  providers: [CreatorRepository, AdminCreatorService],
  exports: [CreatorRepository, AdminCreatorService],
})
export class CreatorModule {}
