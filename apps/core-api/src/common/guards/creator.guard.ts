import { CanActivate, ExecutionContext, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import type { Request } from 'express';
import { AccountStatus, AccountType } from '@vooth/shared';
import { TokenService } from '@common/jwt';
import { Context, ContextKey } from '@common/context';
import { Account } from '@modules/account/domain/account.entity';
import { Creator } from '@modules/creator/domain/creator.entity';

/**
 * vooth-maker(creators/*) 가드. CREATOR 계정 + 활성(승인) 여부를 검증한다.
 * AdminGuard 와 동형이나 type=CREATOR 이고, 승인 기준은 status=ACTIVE.
 */
@Injectable()
export class CreatorGuard implements CanActivate {
  constructor(
    private readonly tokenService: TokenService,
    private readonly dataSource: DataSource,
    private readonly context: Context
  ) {}

  async canActivate(executionContext: ExecutionContext): Promise<boolean> {
    const request = executionContext.switchToHttp().getRequest<Request>();

    const token = this.extractToken(request);
    if (!token) {
      throw new UnauthorizedException('인증 토큰이 없습니다.');
    }

    let payload;
    try {
      payload = this.tokenService.verifyAccessToken(token);
    } catch {
      throw new UnauthorizedException('유효하지 않은 토큰입니다.');
    }

    const account = await this.dataSource
      .getRepository(Account)
      .findOne({ where: { id: payload.sub, type: AccountType.CREATOR }, relations: { role: true } });
    if (!account) {
      throw new UnauthorizedException('존재하지 않는 계정입니다.');
    }

    if (account.status === AccountStatus.EXITED) {
      throw new ForbiddenException('탈퇴한 계정입니다.');
    }

    if (account.status !== AccountStatus.ACTIVE) {
      throw new ForbiddenException('아직 관리자 승인을 받지 못한 계정입니다.');
    }

    const creator = await this.dataSource.getRepository(Creator).findOne({ where: { accountId: account.id } });

    if (!creator) {
      throw new UnauthorizedException('존재하지 않는 크리에이터입니다.');
    }

    this.context.set(ContextKey.ROLE, account.role);
    this.context.set(ContextKey.ACCOUNT, account);
    this.context.set(ContextKey.CREATOR, creator);
    return true;
  }

  private extractToken(request: Request): string | null {
    const authorization = request.headers.authorization;
    if (!authorization) return null;

    const [type, token] = authorization.split(' ');
    return type === 'Bearer' && token ? token : null;
  }
}
