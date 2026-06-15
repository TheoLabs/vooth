import { Module } from '@nestjs/common';
import { RecordingModule } from '@modules/recording/recording.module';
import { LineTakeRepository } from './infrastructure/line-take.repository';
import { CreatorLineTakeService } from './applications/creator-line-take.service';
import { CreatorLineTakeController } from './presentation/creator-line-take.controller';
import { DirectorTakeService } from './applications/director-take.service';
import { DirectorTakeController } from './presentation/director-take.controller';

@Module({
  imports: [RecordingModule],
  controllers: [CreatorLineTakeController, DirectorTakeController],
  providers: [LineTakeRepository, CreatorLineTakeService, DirectorTakeService],
  exports: [LineTakeRepository],
})
export class LineTakeModule {}
