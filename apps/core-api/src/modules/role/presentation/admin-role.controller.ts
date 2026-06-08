import { Controller, Get, Query, UseGuards, Post, Body } from '@nestjs/common';
import { AdminRoleService } from '../applications/admin-role.service';
import { AdminGuard } from '@common/guards';
import { RoleCreateDto, RoleQueryDto } from './dto';

@Controller('admins/roles')
@UseGuards(AdminGuard)
export class AdminRoleController {
  constructor(private readonly adminRoleService: AdminRoleService) {}

  @Get()
  async list(@Query() query: RoleQueryDto) {
    // 1. Destructure body, params, query
    const { searchKey, searchValue, ...options } = query;

    // 2. Get context
    // 3. Get result
    const data = await this.adminRoleService.list({ searchKey, searchValue }, options);

    // 4. Send response
    return { data };
  }

  // TODO: 추후 Super 권한 유저만 가능하게 해야함.
  @Post()
  async create(@Body() body: RoleCreateDto) {
    // 1. Destructure body, params, query
    // 2. Get context
    // 3. Get result
    await this.adminRoleService.create(body);
    // 4. Send response
    return { data: {} };
  }
}
