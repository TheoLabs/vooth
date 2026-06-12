import { ContentModule } from '@modules/content/content.module';
import { Module } from '@nestjs/common';
import { EpisodeRepository } from './infrastructure/episode.repository';
import { AdminEpisodeController } from './presentation/admin-episode.controller';
import { AdminEpisodeService } from './applications/admin-episode.service';
import { CharacterModule } from '@modules/character/character.module';
import { CreatorEpisodeController } from './presentation/creator-episode.controller';
import { CreatorEpisodeService } from './applications/creator-episode.service';

@Module({
  imports: [ContentModule, CharacterModule],
  controllers: [AdminEpisodeController, CreatorEpisodeController],
  providers: [EpisodeRepository, AdminEpisodeService, CreatorEpisodeService],
  exports: [EpisodeRepository, AdminEpisodeService, CreatorEpisodeService],
})
export class EpisodeModule {}
