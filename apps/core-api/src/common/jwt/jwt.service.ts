import { Injectable } from '@nestjs/common';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import { ConfigsService } from '@configs';

export interface AccessTokenPayload {
  /** account id */
  sub: number;
  email: string;
}

@Injectable()
export class TokenService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configsService: ConfigsService
  ) {}

  signAccessToken(payload: AccessTokenPayload): string {
    return this.jwtService.sign(payload, {
      secret: this.configsService.jwt.accessSecret,
      expiresIn: this.configsService.jwt.accessExpiresIn as JwtSignOptions['expiresIn'],
    });
  }

  verifyAccessToken(token: string): AccessTokenPayload {
    return this.jwtService.verify<AccessTokenPayload>(token, {
      secret: this.configsService.jwt.accessSecret,
    });
  }
}
