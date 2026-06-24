import { CreatorGuard } from '@common/guards';
import { Controller, Get, Param, ParseIntPipe, Query, UseGuards } from '@nestjs/common';
import { CreatorContentService } from '../applications/creator-content.service';
import { Context, ContextKey } from '@common/context';
import { Creator } from '@modules/creator/domain/creator.entity';

@Controller('creators/contents')
@UseGuards(CreatorGuard)
export class CreatorContentController {
  constructor(
    private readonly creatorContentService: CreatorContentService,
    private readonly context: Context
  ) {}

  @Get()
  async list(@Query() query: any) {
    // 1. Destructure body, params, query
    const { searchKey, searchValue, ...options } = query;

    // 2. Get context
    const creator = this.context.get<Creator>(ContextKey.CREATOR);

    // 3. Get result
    const data = await this.creatorContentService.list({ creator, searchKey, searchValue }, options);

    // 4. Send response
    return { data };
  }

  @Get(':contentId')
  async retrieve(@Param('contentId', ParseIntPipe) contentId: number) {
    // 1. Destructure body, params, query
    // 2. Get context
    const creator = this.context.get<Creator>(ContextKey.CREATOR);

    // 3. Get result
    const data = await this.creatorContentService.retrieve({ creator, contentId });

    // 4. Send response
    return { data };
  }
}
