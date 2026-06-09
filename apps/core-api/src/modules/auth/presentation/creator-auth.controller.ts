import { Body, Controller, Post } from '@nestjs/common';
import { CreatorAuthService } from '../applications/creator-auth.service';
import { GoogleLoginDto } from './dto/google-login.dto';
import { GoogleDesktopLoginDto } from './dto/google-desktop-login.dto';

@Controller('creators/auth')
export class CreatorAuthController {
  constructor(private readonly creatorAuthService: CreatorAuthService) {}

  @Post('login/google')
  async signInWithGoogle(@Body() body: GoogleLoginDto) {
    const data = await this.creatorAuthService.signInWithGoogle(body);

    return { data };
  }

  /** 데스크톱(vooth-maker) — loopback + PKCE authorization code 교환 로그인. */
  @Post('login/google/desktop')
  async signInWithGoogleDesktop(@Body() body: GoogleDesktopLoginDto) {
    const data = await this.creatorAuthService.signInWithGoogleCode(body);

    return { data };
  }
}
