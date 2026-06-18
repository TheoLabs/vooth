import { Module } from '@nestjs/common';
import { EpisodeRepository } from './infrastructure/episode.repository';
import { AdminEpisodeService } from './applications/admin-episode.service';
import { AdminEpisodeController } from './presentation/admin-episode.controller';
import { ContentModule } from '@modules/content/content.module';
import { FileModule } from '@modules/file/file.module';

@Module({
  imports: [FileModule, ContentModule],
  controllers: [AdminEpisodeController],
  providers: [EpisodeRepository, AdminEpisodeService],
  exports: [EpisodeRepository, AdminEpisodeService],
})
export class EpisodeModule {}
