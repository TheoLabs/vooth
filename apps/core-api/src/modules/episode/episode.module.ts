import { ContentModule } from '@modules/content/content.module';
import { Module } from '@nestjs/common';
import { EpisodeRepository } from './infrastructure/episode.repository';
import { AdminEpisodeController } from './presentation/admin-episode.controller';
import { AdminEpisodeService } from './applications/admin-episode.service';

@Module({
  imports: [ContentModule],
  controllers: [AdminEpisodeController],
  providers: [EpisodeRepository, AdminEpisodeService],
  exports: [EpisodeRepository, AdminEpisodeService],
})
export class EpisodeModule {}
