import { Module } from '@nestjs/common';
import { AdminAuthController } from './presentation/admin-auth.controller';
import { AdminAuthService } from './applications/admin-auth.service';
import { AccountModule } from '@modules/account/account.module';
import { GoogleAuthClient } from './infrastructure/google-auth.client';

@Module({
  imports: [AccountModule],
  controllers: [AdminAuthController],
  providers: [AdminAuthService, GoogleAuthClient],
  exports: [AdminAuthService],
})
export class AuthModule {}
