import { Body, Controller, Post } from '@nestjs/common';
import { DirectorAuthService } from '../applications/director-auth.service';
import { GoogleDesktopLoginDto } from './dto/google-desktop-login.dto';

@Controller('directors/auth')
export class DirectorAuthController {
  constructor(private readonly directorAuthService: DirectorAuthService) {}

  /** 데스크톱(vooth-tool) — loopback + PKCE authorization code 교환 로그인. */
  @Post('login/google/desktop')
  async signInWithGoogleDesktop(@Body() body: GoogleDesktopLoginDto) {
    const data = await this.directorAuthService.signInWithGoogleCode(body);

    return { data };
  }
}
