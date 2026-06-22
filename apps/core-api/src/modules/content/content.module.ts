import { forwardRef, Module } from '@nestjs/common';
import { ContentRepository } from './infrastructure/content.repository';
import { AdminContentService } from './applications/admin-content.service';
import { AdminContentController } from './presentation/admin-content.controller';
import { FileModule } from '@modules/file/file.module';
import { TagModule } from '@modules/tag/tag.module';
import { EpisodeModule } from '@modules/episode/episode.module';

@Module({
  imports: [FileModule, TagModule, forwardRef(() => EpisodeModule)],
  controllers: [AdminContentController],
  providers: [ContentRepository, AdminContentService],
  exports: [ContentRepository, AdminContentService],
})
export class ContentModule {}
