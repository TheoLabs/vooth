import { FileModule } from '@modules/file/file.module';
import { Module } from '@nestjs/common';
import { CreatorRepository } from './infrastructure/creator.repository';
import { AccountModule } from '@modules/account/account.module';
import { AdminCreatorService } from './applications/admin-creator.service';
import { CreatorService } from './applications/creator.service';
import { AdminCreatorController } from './presentation/admin-creator.controller';
import { CreatorMeController } from './presentation/creator-me.controller';

@Module({
  imports: [FileModule, AccountModule],
  controllers: [AdminCreatorController, CreatorMeController],
  providers: [CreatorRepository, AdminCreatorService, CreatorService],
  exports: [CreatorRepository, AdminCreatorService, CreatorService],
})
export class CreatorModule {}
