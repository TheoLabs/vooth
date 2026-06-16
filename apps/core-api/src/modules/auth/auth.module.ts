import { Module } from '@nestjs/common';
import { AdminAuthController } from './presentation/admin-auth.controller';
import { AdminAuthService } from './applications/admin-auth.service';
import { CreatorAuthController } from './presentation/creator-auth.controller';
import { CreatorAuthService } from './applications/creator-auth.service';
import { AccountModule } from '@modules/account/account.module';
import { GoogleAuthClient } from './infrastructure/google-auth.client';

@Module({
  imports: [AccountModule],
  controllers: [AdminAuthController, CreatorAuthController],
  providers: [AdminAuthService, CreatorAuthService, GoogleAuthClient],
  exports: [AdminAuthService, CreatorAuthService],
})
export class AuthModule {}
