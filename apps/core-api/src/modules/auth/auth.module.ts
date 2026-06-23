import { Module } from '@nestjs/common';
import { AdminAuthController } from './presentation/admin-auth.controller';
import { AdminAuthService } from './applications/admin-auth.service';
import { CreatorAuthController } from './presentation/creator-auth.controller';
import { CreatorAuthService } from './applications/creator-auth.service';
import { AccountModule } from '@modules/account/account.module';
import { GoogleAuthClient } from './infrastructure/google-auth.client';
import { DirectorAuthController } from './presentation/director-auth.controller';
import { DirectorAuthService } from './applications/director-auth.service';

@Module({
  imports: [AccountModule],
  controllers: [AdminAuthController, CreatorAuthController, DirectorAuthController],
  providers: [AdminAuthService, CreatorAuthService, GoogleAuthClient, DirectorAuthService],
  exports: [AdminAuthService, CreatorAuthService, DirectorAuthService],
})
export class AuthModule {}
