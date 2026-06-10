import { Module } from '@nestjs/common';
import { ContentRepository } from './infrastructure/content.repository';

@Module({
  imports: [],
  controllers: [],
  providers: [ContentRepository],
  exports: [ContentRepository],
})
export class ContentModule {}
