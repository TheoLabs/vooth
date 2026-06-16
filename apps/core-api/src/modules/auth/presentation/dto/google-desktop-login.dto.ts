import { IsNotEmpty, IsString } from 'class-validator';

/**
 * 데스크톱(설치형) 앱 Google 로그인(PKCE) 본문.
 * Electron 이 시스템 브라우저 + loopback redirect + PKCE 로 받은 값을 서버에 넘겨 교환한다.
 */
export class GoogleDesktopLoginDto {
  /** authorization code (시스템 브라우저 PKCE 플로우로 수신). */
  @IsString()
  @IsNotEmpty()
  code: string;

  /** PKCE code_verifier (앱이 생성, code_challenge 와 쌍). */
  @IsString()
  @IsNotEmpty()
  codeVerifier: string;

  /** code 발급에 사용한 loopback redirect URI (교환 시 동일해야 한다). */
  @IsString()
  @IsNotEmpty()
  redirectUri: string;
}
