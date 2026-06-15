import { Module } from '@nestjs/common';
import { AdminMeController } from './presentation/admin-me.controller';
import { CreatorMeController } from './presentation/creator-me.controller';
import { DirectorMeController } from './presentation/director-me.controller';

@Module({
  imports: [],
  controllers: [AdminMeController, CreatorMeController, DirectorMeController],
  providers: [],
  exports: [],
})
export class MeModule {}
