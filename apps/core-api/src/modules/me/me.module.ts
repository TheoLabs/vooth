import { Module } from '@nestjs/common';
import { AdminMeController } from './presentation/admin-me.controller';

@Module({
  imports: [],
  controllers: [AdminMeController],
  providers: [],
  exports: [],
})
export class MeModule {}
