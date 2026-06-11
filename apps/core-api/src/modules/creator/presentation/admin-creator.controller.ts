import { AdminGuard } from '@common/guards';
import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AdminCreatorService } from '../applications/admin-creator.service';
import { CreatorQueryDto } from './dto';

@Controller('admins/creators')
@UseGuards(AdminGuard)
export class AdminCreatorController {
  constructor(private readonly adminCreatorSerivce: AdminCreatorService) {}

  @Get()
  async list(@Query() query: CreatorQueryDto) {
    // 1. Destructure body, params, query
    const { searchKey, searchValue, ...options } = query;

    // 2. Get context
    // 3. Get result
    const data = await this.adminCreatorSerivce.list({ searchKey, searchValue }, options);

    // 4. Send response
    return { data };
  }
}
