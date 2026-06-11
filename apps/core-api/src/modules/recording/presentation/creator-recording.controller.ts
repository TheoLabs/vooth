import { CreatorGuard } from '@common/guards';
import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { CreatorRecordingService } from '../applications/creator-recording.service';
import { Context, ContextKey } from '@common/context';
import { Creator } from '@modules/creator/domain/creator.entity';

@Controller('creators/recordings')
@UseGuards(CreatorGuard)
export class CreatorRecordingController {
  constructor(
    private readonly creatorRecordingService: CreatorRecordingService,
    private readonly context: Context
  ) {}

  @Post()
  async create(@Body() body: any) {
    // 1. Destructure body, params, query
    // 2. Get context
    const creator = this.context.get<Creator>(ContextKey.CREATOR);

    // 3. Get result
    // 4. Send response
    return { data: {} };
  }
}
