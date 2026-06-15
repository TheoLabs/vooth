import { Module } from '@nestjs/common';
import { RecordingModule } from '@modules/recording/recording.module';
import { LineTakeRepository } from './infrastructure/line-take.repository';
import { CreatorLineTakeService } from './applications/creator-line-take.service';
import { CreatorLineTakeController } from './presentation/creator-line-take.controller';

@Module({
  imports: [RecordingModule],
  controllers: [CreatorLineTakeController],
  providers: [LineTakeRepository, CreatorLineTakeService],
  exports: [LineTakeRepository],
})
export class LineTakeModule {}
