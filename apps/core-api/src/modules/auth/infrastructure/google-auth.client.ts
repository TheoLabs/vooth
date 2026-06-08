import { Injectable, UnauthorizedException } from '@nestjs/common';
import { OAuth2Client } from 'google-auth-library';
import { ConfigsService } from '@configs';

export interface GoogleProfile {
  googleSub: string;
  email: string;
  name: string;
}

@Injectable()
export class GoogleAuthClient {
  private readonly client: OAuth2Client;

  constructor(private readonly configsService: ConfigsService) {
    this.client = new OAuth2Client(this.configsService.google.clientId);
  }

  /**
   * 프론트엔드에서 전달한 Google ID 토큰을 검증하고 식별 정보를 반환한다.
   */
  async verify(idToken: string): Promise<GoogleProfile> {
    let payload;
    try {
      const ticket = await this.client.verifyIdToken({
        idToken,
        audience: this.configsService.google.clientId,
      });
      payload = ticket.getPayload();
    } catch {
      throw new UnauthorizedException('유효하지 않은 Google 토큰입니다.');
    }

    if (!payload?.sub || !payload.email || !payload.name) {
      throw new UnauthorizedException('Google 토큰에서 계정 정보를 확인할 수 없습니다.');
    }

    return { googleSub: payload.sub, email: payload.email, name: payload.name };
  }
}
