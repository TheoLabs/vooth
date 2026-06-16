import { FileModule } from '@modules/file/file.module';
import { Module } from '@nestjs/common';
import { CreatorRepository } from './infrastructure/creator.repository';
import { AccountModule } from '@modules/account/account.module';
import { AdminCreatorService } from './applications/admin-creator.service';
import { AdminCreatorController } from './presentation/admin-creator.controller';
import { CreatorCreatorService } from './applications/creator-creator.service';

@Module({
  imports: [FileModule, AccountModule],
  controllers: [AdminCreatorController],
  providers: [CreatorRepository, AdminCreatorService, CreatorCreatorService],
  exports: [CreatorRepository, AdminCreatorService, CreatorCreatorService],
})
export class CreatorModule {}
