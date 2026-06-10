import { Module } from '@nestjs/common';
import { AdminTagController } from './presentation/admin-tag.controller';
import { TagRepository } from './infrastructure/tag.repository';
import { AdminTagService } from './applications/admin-tag.service';

@Module({
  imports: [],
  controllers: [AdminTagController],
  providers: [TagRepository, AdminTagService],
  exports: [TagRepository, AdminTagService],
})
export class TagModule {}
