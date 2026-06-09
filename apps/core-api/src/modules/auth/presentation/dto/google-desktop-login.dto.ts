import { IsNotEmpty, IsString } from 'class-validator';

/**
 * 데스크톱(vooth-maker) Google 로그인 — 시스템 브라우저 + loopback + PKCE 로
 * 받은 authorization code 를 서버에서 교환하기 위한 입력.
 */
export class GoogleDesktopLoginDto {
  @IsString()
  @IsNotEmpty()
  code: string;

  @IsString()
  @IsNotEmpty()
  codeVerifier: string;

  /** loopback redirect URI (예: http://127.0.0.1:<port>) — code 교환 시 동일 값이어야 함. */
  @IsString()
  @IsNotEmpty()
  redirectUri: string;
}
