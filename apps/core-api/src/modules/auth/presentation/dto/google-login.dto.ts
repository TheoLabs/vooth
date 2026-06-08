import { IsNotEmpty, IsString } from 'class-validator';

export class GoogleLoginDto {
  /** 프론트엔드 Google 로그인에서 발급받은 ID 토큰. */
  @IsString()
  @IsNotEmpty()
  idToken: string;
}
