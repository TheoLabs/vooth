import { AdminGuard } from '@common/guards';
import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { AdminRecordingService } from '../applications/admin-recording.service';

@Controller('admins/recordings')
@UseGuards(AdminGuard)
export class AdminRecordingController {
  constructor(private readonly adminRecordingService: AdminRecordingService) {}
}
