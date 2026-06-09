import { AdminGuard } from '@common/guards';
import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AdminPermissionService } from '../applications/admin-permission.service';
import { PermissionQueryDto } from './dto';

@Controller('admins/permissions')
@UseGuards(AdminGuard)
export class AdminPermissionController {
  constructor(private readonly adminPermissionService: AdminPermissionService) {}

  @Get()
  async list(@Query() query: PermissionQueryDto) {
    // 1. Destructure body, params, query
    const { searchKey, searchValue, categories, ...options } = query;

    // 2. Get context
    // 3. Get result
    const data = await this.adminPermissionService.list({ searchKey, searchValue, categories }, options);

    // 4. Send response
    return { data };
  }
}
