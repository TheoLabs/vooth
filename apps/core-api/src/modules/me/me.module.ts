import { Module } from '@nestjs/common';
import { AdminMeController } from './presentation/admin-me.controller';
import { CreatorMeController } from './presentation/creator-me.controller';
import { CreatorModule } from '@modules/creator/creator.module';

@Module({
  imports: [CreatorModule],
  controllers: [AdminMeController, CreatorMeController],
  providers: [],
})
export class MeModule {}
