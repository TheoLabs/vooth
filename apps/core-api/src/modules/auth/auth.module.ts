import { Module } from '@nestjs/common';
import { AdminAuthController } from './presentation/admin-auth.controller';
import { AdminAuthService } from './applications/admin-auth.service';
import { AccountModule } from '@modules/account/account.module';
import { GoogleAuthClient } from './infrastructure/google-auth.client';
import { CreatorAuthController } from './presentation/creator-auth.controller';
import { CreatorAuthService } from './applications/creator-auth.service';
import { DirectorAuthController } from './presentation/director-auth.controller';
import { DirectorAuthService } from './applications/director-auth.service';

@Module({
  imports: [AccountModule],
  controllers: [AdminAuthController, CreatorAuthController, DirectorAuthController],
  providers: [AdminAuthService, GoogleAuthClient, CreatorAuthService, DirectorAuthService],
  exports: [AdminAuthService, CreatorAuthService, DirectorAuthService],
})
export class AuthModule {}
