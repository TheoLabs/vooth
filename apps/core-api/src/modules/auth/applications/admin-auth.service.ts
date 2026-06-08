import { DddService } from '@libs/ddd';
import { Transactional } from '@libs/decorators';
import { TokenService } from '@common/jwt';
import { AccountRepository } from '@modules/account/infrastructure/account.repository';
import { Account } from '@modules/account/domain/account.entity';
import { Injectable } from '@nestjs/common';
import { GoogleAuthClient } from '../infrastructure/google-auth.client';
import { GoogleLoginDto } from '../presentation/dto/google-login.dto';
import { AccountType } from '@vooth/shared';

@Injectable()
export class AdminAuthService extends DddService {
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

    let [account] = await this.accountRepository.find({ googleSub });

    if (!account) {
      account = Account.of({ googleSub, email, name, type: AccountType.ADMIN });
      await this.accountRepository.save([account]);
    }

    const accessToken = this.tokenService.signAccessToken({ sub: account.id, email: account.email });

    return { accessToken };
  }
}
