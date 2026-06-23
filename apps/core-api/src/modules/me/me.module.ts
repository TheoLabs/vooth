import { Module } from '@nestjs/common';
import { AdminMeController } from './presentation/admin-me.controller';
import { CreatorMeController } from './presentation/creator-me.controller';
import { CreatorModule } from '@modules/creator/creator.module';
import { DirectorMeController } from './presentation/director-me.controller';

@Module({
  imports: [CreatorModule],
  controllers: [AdminMeController, CreatorMeController, DirectorMeController],
  providers: [],
})
export class MeModule {}
