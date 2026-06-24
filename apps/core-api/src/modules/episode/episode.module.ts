import { Module } from '@nestjs/common';
import { EpisodeRepository } from './infrastructure/episode.repository';
import { AdminEpisodeService } from './applications/admin-episode.service';
import { AdminEpisodeController } from './presentation/admin-episode.controller';
import { FileModule } from '@modules/file/file.module';
import { DirectorEpisodeController } from './presentation/director-episode.controller';
import { DirectorEpisodeService } from './applications/director-episode.service';
import { ContentRepository } from '@modules/content/infrastructure/content.repository';
import { CutRepository } from '@modules/cut/infrastructure/cut.repository';
import { CreatorEpisodeController } from './presentation/creator-episode.controller';
import { CreatorEpisodeService } from './applications/creator-episode.service';

@Module({
  imports: [FileModule],
  controllers: [AdminEpisodeController, DirectorEpisodeController, CreatorEpisodeController],
  providers: [
    EpisodeRepository,
    ContentRepository,
    AdminEpisodeService,
    DirectorEpisodeService,
    CreatorEpisodeService,
    CutRepository,
  ],
  exports: [EpisodeRepository, AdminEpisodeService, DirectorEpisodeService, CreatorEpisodeService],
})
export class EpisodeModule {}
