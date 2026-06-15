import { DirectorGuard } from '@common/guards';
import { Controller, Get, Param, ParseIntPipe, Query, UseGuards } from '@nestjs/common';
import { DirectorContentService } from '../applications/director-content.service';
import { DirectorContentQueryDto } from './dto';

@Controller('directors/contents')
@UseGuards(DirectorGuard)
export class DirectorContentController {
  constructor(private readonly directorContentService: DirectorContentService) {}

  @Get()
  async list(@Query() query: DirectorContentQueryDto) {
    // 1. Destructure body, params, query
    const { searchKey, searchValue, ...options } = query;

    // 2. Get context
    // 3. Get result
    const data = await this.directorContentService.list({ searchKey, searchValue }, options);

    // 4. Send response
    return { data };
  }

  @Get(':id')
  async retrieve(@Param('id', ParseIntPipe) id: number) {
    // 1. Destructure body, params, query
    // 2. Get context
    // 3. Get result
    const data = await this.directorContentService.retrieve({ id });

    // 4. Send response
    return { data };
  }
}
