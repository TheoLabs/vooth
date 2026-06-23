import { Module } from '@nestjs/common';
import { EpisodeRepository } from './infrastructure/episode.repository';
import { AdminEpisodeService } from './applications/admin-episode.service';
import { AdminEpisodeController } from './presentation/admin-episode.controller';
import { FileModule } from '@modules/file/file.module';
import { DirectorEpisodeController } from './presentation/director-episode.controller';
import { DirectorEpisodeService } from './applications/director-episode.service';
import { ContentRepository } from '@modules/content/infrastructure/content.repository';
import { CutRepository } from '@modules/cut/infrastructure/cut.repository';

@Module({
  imports: [FileModule],
  controllers: [AdminEpisodeController, DirectorEpisodeController],
  providers: [EpisodeRepository, ContentRepository, AdminEpisodeService, DirectorEpisodeService, CutRepository],
  exports: [EpisodeRepository, AdminEpisodeService, DirectorEpisodeService],
})
export class EpisodeModule {}
