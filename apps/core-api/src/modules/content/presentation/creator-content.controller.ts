import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import { CreatorContentService } from '../applications/creator-content.service';

@Controller('creators/contents')
export class CreatorContentController {
  constructor(private readonly creatorContentService: CreatorContentService) {}

  @Get()
  async list(@Query() query: any) {
    // 1. Destructure body, params, query
    const { searchKey, searchValue, ...options } = query;

    // 2. Get context
    // 3. Get result
    const data = await this.creatorContentService.list({ searchKey, searchValue }, options);

    // 4. Send response
    return { data };
  }

  @Get(':id')
  async retrieve(@Param('id', ParseIntPipe) id: number) {
    // 1. Destructure body, params, query
    // 2. Get context
    // 3. Get result
    const data = await this.creatorContentService.retrieve({ id });

    // 4. Send response
    return { data };
  }
}
