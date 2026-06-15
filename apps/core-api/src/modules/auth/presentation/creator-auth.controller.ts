import { Body, Controller, Post } from '@nestjs/common';
import { CreatorAuthService } from '../applications/creator-auth.service';
import { GoogleDesktopLoginDto } from './dto/google-desktop-login.dto';

@Controller('creators/auth')
export class CreatorAuthController {
  constructor(private readonly creatorAuthService: CreatorAuthService) {}

  /** 데스크톱(vooth-maker) — loopback + PKCE authorization code 교환 로그인. */
  @Post('login/google/desktop')
  async signInWithGoogleDesktop(@Body() body: GoogleDesktopLoginDto) {
    const data = await this.creatorAuthService.signInWithGoogleCode(body);

    return { data };
  }
}
