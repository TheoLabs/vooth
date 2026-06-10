import { Module } from '@nestjs/common';
import { AccountModule } from './account/account.module';
import { RoleModule } from './role/role.module';
import { PermissionModule } from './permission/permission.module';
import { AuthModule } from './auth/auth.module';
import { MeModule } from './me/me.module';
import { ContentModule } from './content/content.module';

@Module({
  imports: [AccountModule, RoleModule, PermissionModule, AuthModule, MeModule, ContentModule],
  exports: [AccountModule, RoleModule, PermissionModule, AuthModule, MeModule, ContentModule],
})
export class DomainModule {}
