import { CreatorGuard } from '@common/guards';
import { Body, Controller, Param, ParseIntPipe, Post, Put, UseGuards } from '@nestjs/common';
import { CreatorFileService } from '../applications/creator-file.service';
import { FilePresignDto } from './dto';

@Controller('creators/files')
@UseGuards(CreatorGuard)
export class CreatorFileController {
  constructor(private readonly creatorFileService: CreatorFileService) {}

  @Post('presign')
  async presign(@Body() body: FilePresignDto) {
    // 1. Destructure body, params, query
    // 2. Get context
    // 3. Get result
    const data = await this.creatorFileService.presign(body);

    // 4. Send response
    return { data };
  }

  @Put(':id/commit')
  async commit(@Param('id', ParseIntPipe) id: number) {
    // 1. Destructure body, params, query
    // 2. Get context
    // 3. Get result
    await this.creatorFileService.commit({ id });

    // 4. Send response
    return { data: {} };
  }
}
