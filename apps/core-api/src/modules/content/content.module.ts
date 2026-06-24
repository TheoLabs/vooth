import { Module } from '@nestjs/common';
import { ContentRepository } from './infrastructure/content.repository';
import { AdminContentService } from './applications/admin-content.service';
import { AdminContentController } from './presentation/admin-content.controller';
import { FileModule } from '@modules/file/file.module';
import { TagModule } from '@modules/tag/tag.module';
import { EpisodeModule } from '@modules/episode/episode.module';
import { DirectorContentController } from './presentation/director-content.controller';
import { DirectorContentService } from './applications/director-content.service';
import { CreatorContentController } from './presentation/creator-content.controller';
import { CreatorContentService } from './applications/creator-content.service';
import { CastingRepository } from '@modules/casting/infrastructure/casting.repository';

@Module({
  imports: [FileModule, TagModule, EpisodeModule],
  controllers: [AdminContentController, DirectorContentController, CreatorContentController],
  providers: [ContentRepository, AdminContentService, DirectorContentService, CreatorContentService, CastingRepository],
  exports: [ContentRepository, AdminContentService, DirectorContentService, CreatorContentService],
})
export class ContentModule {}
