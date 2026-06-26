import { CreatorGuard } from '@common/guards';
import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Put, UseGuards } from '@nestjs/common';
import { CreatorRecordingService } from '../applications/creator-recording.service';
import { Context, ContextKey } from '@common/context';
import { Creator } from '@modules/creator/domain/creator.entity';
import { RecordingCreateDto } from './dto';

@Controller('creators')
@UseGuards(CreatorGuard)
export class CreatorRecordingController {
  constructor(
    private readonly creatorRecordingService: CreatorRecordingService,
    private readonly context: Context
  ) {}

  @Post('episodes/:episodeId/cuts/:cutId/lines/:lineId')
  async createRecording(
    @Param('episodeId', ParseIntPipe) episodeId: number,
    @Param('cutId', ParseIntPipe) cutId: number,
    @Param('lineId', ParseIntPipe) lineId: number,
    @Body() body: RecordingCreateDto
  ) {
    // 1. Destructure body, params, query
    // 2. Get context
    const creator = this.context.get<Creator>(ContextKey.CREATOR);

    // 3. Get result
    await this.creatorRecordingService.record({ creator, episodeId, cutId, lineId, ...body });

    // 4. Send response
    return { data: {} };
  }

  @Delete('recordings/:recordingId')
  async removeRecording(@Param('recordingId', ParseIntPipe) recordingId: number) {
    // 1. Destructure body, params, query
    // 2. Get context
    const creator = this.context.get<Creator>(ContextKey.CREATOR);

    // 3. Get result
    await this.creatorRecordingService.remove({ creator, recordingId });

    // 4. Send response
    return { data: {} };
  }

  @Put('recordings/:recordingId/select')
  async selectRecording(@Param('recordingId', ParseIntPipe) recordingId: number) {
    // 1. Destructure body, params, query
    // 2. Get context
    const creator = this.context.get<Creator>(ContextKey.CREATOR);

    // 3. Get result
    await this.creatorRecordingService.select({ creator, recordingId });

    // 4. Send response
    return { data: {} };
  }
}
