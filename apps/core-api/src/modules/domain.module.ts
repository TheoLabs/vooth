import { Module } from '@nestjs/common';
import { AccountModule } from './account/account.module';
import { RoleModule } from './role/role.module';
import { PermissionModule } from './permission/permission.module';

@Module({
  imports: [AccountModule, RoleModule, PermissionModule],
  exports: [AccountModule, RoleModule, PermissionModule],
})
export class DomainModule {}
