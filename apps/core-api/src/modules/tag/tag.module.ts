import { Module } from '@nestjs/common';
import { TagRepository } from './infrastructure/tag.repository';

@Module({
  imports: [],
  controllers: [],
  providers: [TagRepository],
  exports: [TagRepository],
})
export class TagModule {}
