import { Module } from '@nestjs/common';
import { RecordingRepository } from './infrastructure/recording.repository';
import { CreatorRecordingService } from './applications/creator-recording.service';
import { CreatorRecordingController } from './presentation/creator-recording.controller';
import { FileModule } from '@modules/file/file.module';
import { EpisodeModule } from '@modules/episode/episode.module';
import { CutModule } from '@modules/cut/cut.module';
import { CastingModule } from '@modules/casting/casting.module';

@Module({
  imports: [FileModule, EpisodeModule, CutModule, CastingModule],
  controllers: [CreatorRecordingController],
  providers: [RecordingRepository, CreatorRecordingService],
  exports: [RecordingRepository, CreatorRecordingService],
})
export class RecordingModule {}
