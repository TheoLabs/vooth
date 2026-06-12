import { Module } from '@nestjs/common';
import { ContentRepository } from './infrastructure/content.repository';
import { AdminContentController } from './presentation/admin-content.controller';
import { AdminContentService } from './applications/admin-content.service';
import { TagModule } from '@modules/tag/tag.module';
import { CreatorContentController } from './presentation/creator-content.controller';
import { CreatorContentService } from './applications/creator-content.service';

@Module({
  imports: [TagModule],
  controllers: [AdminContentController, CreatorContentController],
  providers: [ContentRepository, AdminContentService, CreatorContentService],
  exports: [ContentRepository, AdminContentService, CreatorContentService],
})
export class ContentModule {}
