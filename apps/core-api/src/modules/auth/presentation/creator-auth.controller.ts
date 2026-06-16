import { Body, Controller, Post } from '@nestjs/common';
import { CreatorAuthService } from '../applications/creator-auth.service';
import { GoogleDesktopLoginDto } from './dto/google-desktop-login.dto';

@Controller('creators/auth')
export class CreatorAuthController {
  constructor(private readonly creatorAuthService: CreatorAuthService) {}

  @Post('login/google/desktop')
  async signInWithGoogleDesktop(@Body() body: GoogleDesktopLoginDto) {
    const data = await this.creatorAuthService.signInWithGoogleDesktop(body);

    return { data };
  }
}
