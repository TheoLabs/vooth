import { forwardRef, Module } from '@nestjs/common';
import { RecordingRepository } from './infrastructure/recording.repository';
import { AdminRecordingService } from './applications/admin-recording.service';
import { AdminRecordingController } from './presentation/admin-recording.controller';
import { CreatorRecordingController } from './presentation/creator-recording.controller';
import { CreatorRecordingService } from './applications/creator-recording.service';
import { EpisodeModule } from '@modules/episode/episode.module';
import { LineTakeModule } from '@modules/line-take/line-take.module';

@Module({
  // RecordingModule ↔ LineTakeModule 상호 의존(삭제 시 LineTake 정리 / DirectorTake 가 RecordingRepository 사용)
  // → 순환 모듈 의존이라 양쪽 forwardRef 로 지연 해소.
  imports: [EpisodeModule, forwardRef(() => LineTakeModule)],
  controllers: [AdminRecordingController, CreatorRecordingController],
  providers: [RecordingRepository, AdminRecordingService, CreatorRecordingService],
  exports: [RecordingRepository, AdminRecordingService, CreatorRecordingService],
})
export class RecordingModule {}
