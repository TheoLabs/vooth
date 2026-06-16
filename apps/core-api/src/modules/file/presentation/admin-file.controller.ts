import { AdminGuard } from '@common/guards';
import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { AdminFileService } from '../applications/admin-file.service';
import { FilePresignDto } from './dto';

@Controller('admins/files')
@UseGuards(AdminGuard)
export class AdminFileController {
  constructor(private readonly fileService: AdminFileService) {}

  @Post('presign')
  async presign(@Body() body: FilePresignDto) {
    // 1. Destructure body, params, query
    // 2. Get context
    // 3. Get result
    const data = await this.fileService.presign(body);

    // 4. Send response
    return { data };
  }
}
