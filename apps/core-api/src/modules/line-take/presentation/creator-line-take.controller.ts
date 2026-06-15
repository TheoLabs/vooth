import { CreatorGuard } from '@common/guards';
import { Body, Controller, Delete, Get, Param, ParseIntPipe, Put, Query, UseGuards } from '@nestjs/common';
import { Context, ContextKey } from '@common/context';
import { Creator } from '@modules/creator/domain/creator.entity';
import { CreatorLineTakeService } from '../applications/creator-line-take.service';
import { LineTakeQueryDto, LineTakeSelectDto } from './dto';

@Controller('creators/line-takes')
@UseGuards(CreatorGuard)
export class CreatorLineTakeController {
  constructor(
    private readonly creatorLineTakeService: CreatorLineTakeService,
    private readonly context: Context
  ) {}

  @Put()
  async select(@Body() body: LineTakeSelectDto) {
    // 2. Get context
    const creator = this.context.get<Creator>(ContextKey.CREATOR);

    // 3. Get result
    await this.creatorLineTakeService.select({ creator, ...body });

    // 4. Send response
    return { data: {} };
  }

  @Get()
  async list(@Query() query: LineTakeQueryDto) {
    const { episodeId } = query;
    const creator = this.context.get<Creator>(ContextKey.CREATOR);

    const data = await this.creatorLineTakeService.list({ creator, episodeId });

    return { data };
  }

  @Delete(':lineId')
  async clear(@Param('lineId', ParseIntPipe) lineId: number) {
    const creator = this.context.get<Creator>(ContextKey.CREATOR);

    await this.creatorLineTakeService.clear({ creator, lineId });

    return { data: {} };
  }
}
