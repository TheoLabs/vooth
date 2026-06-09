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
        // 웹(백오피스) / 데스크톱(maker) 클라이언트 둘 다 허용.
        audience: [this.configsService.google.clientId, this.configsService.google.desktopClientId].filter(
          Boolean
        ),
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

  /**
   * 데스크톱(설치형) 앱의 OAuth authorization code 를 교환한다.
   * Electron 이 시스템 브라우저 + loopback + PKCE 로 받은 code 를 서버에서 교환하고,
   * 발급된 id_token 을 검증해 식별 정보를 반환한다. (secret 은 서버에만 보관)
   */
  async exchangeCode({
    code,
    codeVerifier,
    redirectUri,
  }: {
    code: string;
    codeVerifier: string;
    redirectUri: string;
  }): Promise<GoogleProfile> {
    let idToken: string | null | undefined;
    try {
      const oauth2 = new OAuth2Client({
        clientId: this.configsService.google.desktopClientId,
        clientSecret: this.configsService.google.desktopClientSecret,
        redirectUri,
      });
      const { tokens } = await oauth2.getToken({ code, codeVerifier, redirect_uri: redirectUri });
      idToken = tokens.id_token;
    } catch {
      throw new UnauthorizedException('Google 인증 코드 교환에 실패했습니다.');
    }

    if (!idToken) {
      throw new UnauthorizedException('Google id_token 을 받지 못했습니다.');
    }

    return this.verify(idToken);
  }
}
