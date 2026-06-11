import { DddService } from '@libs/ddd';
import { Injectable } from '@nestjs/common';
import { RecordingRepository } from '../infrastructure/recording.repository';

@Injectable()
export class AdminRecordingService extends DddService {
  constructor(private readonly recordingRepository: RecordingRepository) {
    super();
  }
}
