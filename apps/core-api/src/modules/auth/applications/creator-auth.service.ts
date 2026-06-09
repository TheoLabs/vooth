import { DddService } from '@libs/ddd';
import { Transactional } from '@libs/decorators';
import { TokenService } from '@common/jwt';
import { AccountRepository } from '@modules/account/infrastructure/account.repository';
import { Account } from '@modules/account/domain/account.entity';
import { Injectable } from '@nestjs/common';
import { GoogleAuthClient } from '../infrastructure/google-auth.client';
import { GoogleLoginDto } from '../presentation/dto/google-login.dto';
import { GoogleDesktopLoginDto } from '../presentation/dto/google-desktop-login.dto';
import { AccountType } from '@vooth/shared';

@Injectable()
export class CreatorAuthService extends DddService {
  constructor(
    private readonly accountRepository: AccountRepository,
    private readonly googleAuthClient: GoogleAuthClient,
    private readonly tokenService: TokenService
  ) {
    super();
  }

  @Transactional()
  async signInWithGoogle({ idToken }: GoogleLoginDto) {
    const { googleSub, email, name } = await this.googleAuthClient.verify(idToken);

    return this.issueToken({ googleSub, email, name });
  }

  /**
   * 데스크톱(vooth-maker) 로그인: loopback + PKCE 로 받은 authorization code 를
   * 서버에서 교환해 식별 후 access token 을 발급한다.
   */
  @Transactional()
  async signInWithGoogleCode({ code, codeVerifier, redirectUri }: GoogleDesktopLoginDto) {
    const { googleSub, email, name } = await this.googleAuthClient.exchangeCode({
      code,
      codeVerifier,
      redirectUri,
    });

    return this.issueToken({ googleSub, email, name });
  }

  private async issueToken({ googleSub, email, name }: { googleSub: string; email: string; name: string }) {
    let [account] = await this.accountRepository.find({ googleSub, types: [AccountType.CREATOR] });

    if (!account) {
      account = Account.of({ googleSub, email, name, type: AccountType.CREATOR });
      await this.accountRepository.save([account]);
    }

    const accessToken = this.tokenService.signAccessToken({ sub: account.id, email: account.email });

    return { accessToken };
  }
}
