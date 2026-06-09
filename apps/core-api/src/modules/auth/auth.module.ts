import { Module } from '@nestjs/common';
import { AdminAuthController } from './presentation/admin-auth.controller';
import { AdminAuthService } from './applications/admin-auth.service';
import { AccountModule } from '@modules/account/account.module';
import { GoogleAuthClient } from './infrastructure/google-auth.client';
import { CreatorAuthController } from './presentation/creator-auth.controller';
import { CreatorAuthService } from './applications/creator-auth.service';

@Module({
  imports: [AccountModule],
  controllers: [AdminAuthController, CreatorAuthController],
  providers: [AdminAuthService, GoogleAuthClient, CreatorAuthService],
  exports: [AdminAuthService, CreatorAuthService],
})
export class AuthModule {}
