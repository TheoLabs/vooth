import { ContentModule } from '@modules/content/content.module';
import { Module } from '@nestjs/common';
import { EpisodeRepository } from './infrastructure/episode.repository';
import { AdminEpisodeController } from './presentation/admin-episode.controller';
import { AdminEpisodeService } from './applications/admin-episode.service';
import { CharacterModule } from '@modules/character/character.module';
import { CreatorEpisodeController } from './presentation/creator-episode.controller';
import { CreatorEpisodeService } from './applications/creator-episode.service';
import { DirectorEpisodeController } from './presentation/director-episode.controller';
import { DirectorEpisodeService } from './applications/director-episode.service';

@Module({
  imports: [ContentModule, CharacterModule],
  controllers: [AdminEpisodeController, CreatorEpisodeController, DirectorEpisodeController],
  providers: [EpisodeRepository, AdminEpisodeService, CreatorEpisodeService, DirectorEpisodeService],
  exports: [EpisodeRepository, AdminEpisodeService, CreatorEpisodeService, DirectorEpisodeService],
})
export class EpisodeModule {}
