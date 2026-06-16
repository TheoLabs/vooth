import { CreatorGuard } from '@common/guards';
import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { FileService } from '../applications/file.service';
import { FilePresignDto } from './dto';

@Controller('creators/files')
@UseGuards(CreatorGuard)
export class CreatorFileController {
  constructor(private readonly fileService: FileService) {}

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
