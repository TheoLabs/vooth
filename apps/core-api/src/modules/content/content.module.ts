import { Module } from '@nestjs/common';
import { ContentRepository } from './infrastructure/content.repository';
import { AdminContentController } from './presentation/admin-content.controller';
import { AdminContentService } from './applications/admin-content.service';
import { TagModule } from '@modules/tag/tag.module';

@Module({
  imports: [TagModule],
  controllers: [AdminContentController],
  providers: [ContentRepository, AdminContentService],
  exports: [ContentRepository, AdminContentService],
})
export class ContentModule {}
