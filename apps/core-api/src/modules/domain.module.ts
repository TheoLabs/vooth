import { Module } from '@nestjs/common';
import { AccountModule } from './account/account.module';
import { RoleModule } from './role/role.module';
import { PermissionModule } from './permission/permission.module';
import { AuthModule } from './auth/auth.module';
import { MeModule } from './me/me.module';
import { CreatorModule } from './creator/creator.module';
import { FileModule } from './file/file.module';
import { TagModule } from './tag/tag.module';
import { ContentModule } from './content/content.module';
import { CharacterModule } from './character/character.module';
import { EpisodeModule } from './episode/episode.module';
import { CastingModule } from './casting/casting.module';
import { CutModule } from './cut/cut.module';

@Module({
  imports: [
    AccountModule,
    RoleModule,
    PermissionModule,
    AuthModule,
    MeModule,
    CreatorModule,
    FileModule,
    TagModule,
    ContentModule,
    CharacterModule,
    EpisodeModule,
    CastingModule,
    CutModule,
  ],
  exports: [
    AccountModule,
    RoleModule,
    PermissionModule,
    AuthModule,
    MeModule,
    CreatorModule,
    FileModule,
    TagModule,
    ContentModule,
    CharacterModule,
    EpisodeModule,
    CastingModule,
    CutModule,
  ],
})
export class DomainModule {}
