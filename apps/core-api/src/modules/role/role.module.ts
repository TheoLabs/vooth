import { Module } from '@nestjs/common';
import { RoleRepository } from './infrastructure/role.repository';
import { AdminRoleController } from './presentation/admin-role.controller';
import { AdminRoleService } from './applications/admin-role.service';
import { PermissionModule } from '@modules/permission/permission.module';

@Module({
  imports: [PermissionModule],
  controllers: [AdminRoleController],
  providers: [RoleRepository, AdminRoleService],
  exports: [RoleRepository, AdminRoleService],
})
export class RoleModule {}
