import { DddService } from '@libs/ddd';
import { Transactional } from '@libs/decorators';
import { TokenService } from '@common/jwt';
import { AccountRepository } from '@modules/account/infrastructure/account.repository';
import { Account } from '@modules/account/domain/account.entity';
import { Injectable } from '@nestjs/common';
import { GoogleAuthClient } from '../infrastructure/google-auth.client';
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

  /**
   * vooth-maker(데스크톱) Google 로그인(PKCE).
   * 최초 로그인이면 CREATOR 계정을 PENDING 으로 자동 생성한다(관리자 승인 전까지 가드 통과 불가).
   */
  @Transactional()
  async signInWithGoogleDesktop({ code, codeVerifier, redirectUri }: GoogleDesktopLoginDto) {
    const { googleSub, email, name } = await this.googleAuthClient.exchangeCode({ code, codeVerifier, redirectUri });

    let [account] = await this.accountRepository.find({ googleSub, types: [AccountType.CREATOR] });

    if (!account) {
      account = Account.of({ googleSub, email, name, type: AccountType.CREATOR });
      await this.accountRepository.save([account]);
    }

    const accessToken = this.tokenService.signAccessToken({ sub: account.id, email: account.email });

    return { accessToken };
  }
}
