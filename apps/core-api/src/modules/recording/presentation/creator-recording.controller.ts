import { CreatorGuard } from '@common/guards';
import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { CreatorRecordingService } from '../applications/creator-recording.service';
import { Context, ContextKey } from '@common/context';
import { Creator } from '@modules/creator/domain/creator.entity';
import { RecordingCreateDto, RecordingQueryDto } from './dto';

@Controller('creators/recordings')
@UseGuards(CreatorGuard)
export class CreatorRecordingController {
  constructor(
    private readonly creatorRecordingService: CreatorRecordingService,
    private readonly context: Context
  ) {}

  @Post()
  async create(@Body() body: RecordingCreateDto) {
    // 1. Destructure body, params, query
    // 2. Get context
    const creator = this.context.get<Creator>(ContextKey.CREATOR);

    // 3. Get result
    await this.creatorRecordingService.create({ creator, ...body });

    // 4. Send response
    return { data: {} };
  }

  @Get()
  async list(@Query() query: RecordingQueryDto) {
    // 1. Destructure body, params, query
    const { episodeId, ...options } = query;

    // 2. Get context
    const creator = this.context.get<Creator>(ContextKey.CREATOR);

    // 3. Get result
    const data = await this.creatorRecordingService.list({ creator, episodeId }, options);

    // 4. Send response
    return { data };
  }
}
