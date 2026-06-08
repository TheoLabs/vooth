import { Body, Controller, Post } from '@nestjs/common';
import { AdminAuthService } from '../applications/admin-auth.service';
import { GoogleLoginDto } from './dto/google-login.dto';

@Controller('admins/auth')
export class AdminAuthController {
  constructor(private readonly adminAuthService: AdminAuthService) {}

  @Post('login/google')
  async signInWithGoogle(@Body() body: GoogleLoginDto) {
    const data = await this.adminAuthService.signInWithGoogle(body);

    return { data };
  }
}
