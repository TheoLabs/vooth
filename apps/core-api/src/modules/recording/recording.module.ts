import { Module } from '@nestjs/common';
import { RecordingRepository } from './infrastructure/recording.repository';
import { AdminRecordingService } from './applications/admin-recording.service';
import { AdminRecordingController } from './presentation/admin-recording.controller';
import { CreatorRecordingController } from './presentation/creator-recording.controller';
import { CreatorRecordingService } from './applications/creator-recording.service';
import { EpisodeModule } from '@modules/episode/episode.module';

@Module({
  imports: [EpisodeModule],
  controllers: [AdminRecordingController, CreatorRecordingController],
  providers: [RecordingRepository, AdminRecordingService, CreatorRecordingService],
  exports: [RecordingRepository, AdminRecordingService, CreatorRecordingService],
})
export class RecordingModule {}
