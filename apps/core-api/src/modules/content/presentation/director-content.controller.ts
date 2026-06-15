import { DirectorGuard } from '@common/guards';
import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { DirectorContentService } from '../applications/director-content.service';

@Controller('directors/contents')
@UseGuards(DirectorGuard)
export class DirectorContentController {
  constructor(private readonly directorContentService: DirectorContentService) {}

  @Get()
  async list(@Query() query: any) {
    // 1. Destructure body, params, query
    const { searchKey, searchValue, ...options } = query;

    // 2. Get context
    // 3. Get result
    const data = await this.directorContentService.list({ searchKey, searchValue }, options);

    // 4. Send response
    return { data };
  }
}
