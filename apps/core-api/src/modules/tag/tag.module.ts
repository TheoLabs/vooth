import { Module } from '@nestjs/common';
import { TagRepository } from './infrastructure/tag.repository';
import { AdminTagService } from './applications/admin-tag.service';
import { AdminTagController } from './presentation/admin-tag.controller';

@Module({
  imports: [],
  controllers: [AdminTagController],
  providers: [TagRepository, AdminTagService],
  exports: [TagRepository, AdminTagService],
})
export class TagModule {}
