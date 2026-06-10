import { Module } from '@nestjs/common';
import { AccountModule } from './account/account.module';
import { RoleModule } from './role/role.module';
import { PermissionModule } from './permission/permission.module';
import { AuthModule } from './auth/auth.module';
import { MeModule } from './me/me.module';
import { ContentModule } from './content/content.module';
import { TagModule } from './tag/tag.module';
import { FileModule } from './file/file.module';
import { CharacterModule } from './character/character.module';

@Module({
  imports: [
    AccountModule,
    RoleModule,
    PermissionModule,
    AuthModule,
    MeModule,
    ContentModule,
    TagModule,
    FileModule,
    CharacterModule,
  ],
  exports: [
    AccountModule,
    RoleModule,
    PermissionModule,
    AuthModule,
    MeModule,
    ContentModule,
    TagModule,
    FileModule,
    CharacterModule,
  ],
})
export class DomainModule {}
