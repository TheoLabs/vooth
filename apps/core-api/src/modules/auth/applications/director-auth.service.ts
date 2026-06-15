import { DddService } from '@libs/ddd';
import { Transactional } from '@libs/decorators';
import { TokenService } from '@common/jwt';
import { AccountRepository } from '@modules/account/infrastructure/account.repository';
import { Account } from '@modules/account/domain/account.entity';
import { Injectable } from '@nestjs/common';
import { GoogleAuthClient } from '../infrastructure/google-auth.client';
import { GoogleDesktopLoginDto } from '../presentation/dto/google-desktop-login.dto';
import { AccountType } from '@vooth/shared';

/**
 * 연출·제작(vooth-tool) 로그인. 연출자/검수자는 내부 관리자이므로 ADMIN 계정으로 식별한다.
 * (DirectorGuard 와 동일하게 ADMIN 표면 — back-office=admins, vooth-tool=directors)
 * vooth-tool 은 데스크톱 앱이므로 loopback + PKCE 데스크톱 플로우만 제공한다.
 */
@Injectable()
export class DirectorAuthService extends DddService {
  constructor(
    private readonly accountRepository: AccountRepository,
    private readonly googleAuthClient: GoogleAuthClient,
    private readonly tokenService: TokenService
  ) {
    super();
  }

  /**
   * 데스크톱(vooth-tool) 로그인: loopback + PKCE 로 받은 authorization code 를
   * 서버에서 교환해 ADMIN 계정으로 식별 후 access token 을 발급한다.
   */
  @Transactional()
  async signInWithGoogleCode({ code, codeVerifier, redirectUri }: GoogleDesktopLoginDto) {
    const { googleSub, email, name } = await this.googleAuthClient.exchangeCode({
      code,
      codeVerifier,
      redirectUri,
    });

    let [account] = await this.accountRepository.find({ googleSub, types: [AccountType.ADMIN] });

    if (!account) {
      account = Account.of({ googleSub, email, name, type: AccountType.ADMIN });
      await this.accountRepository.save([account]);
    }

    const accessToken = this.tokenService.signAccessToken({ sub: account.id, email: account.email });

    return { accessToken };
  }
}
