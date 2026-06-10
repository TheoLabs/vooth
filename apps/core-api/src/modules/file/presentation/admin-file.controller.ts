import { AdminGuard } from '@common/guards';
import { Body, Controller, Param, ParseIntPipe, Post, Put, UseGuards } from '@nestjs/common';
import { AdminFileService } from '../applications/admin-file.service';
import { FilePresignDto } from './dto';

@Controller('admins/files')
@UseGuards(AdminGuard)
export class AdminFileController {
  constructor(private readonly adminFileService: AdminFileService) {}

  @Post('presign')
  async presign(@Body() body: FilePresignDto) {
    // 1. Destructure body, params, query
    // 2. Get context
    // 3. Get result
    const data = await this.adminFileService.presign(body);

    // 4. Send response
    return { data };
  }

  @Put(':id/commit')
  async commit(@Param('id', ParseIntPipe) id: number) {
    // 1. Destructure body, params, query
    // 2. Get context
    // 3. Get result
    await this.adminFileService.commit({ id });

    // 4. Send response
    return { data: {} };
  }
}
