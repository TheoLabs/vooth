import { FileModule } from '@modules/file/file.module';
import { Module } from '@nestjs/common';
import { CreatorRepository } from './infrastructure/creator.repository';

@Module({
  imports: [FileModule],
  controllers: [],
  providers: [CreatorRepository],
  exports: [CreatorRepository],
})
export class CreatorModule {}
