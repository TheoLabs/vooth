import { CanActivate, ExecutionContext, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import type { Request } from 'express';
import { AccountStatus } from '@vooth/shared';
import { TokenService } from '@common/jwt';
import { Context, ContextKey } from '@common/context';
import { Account } from '@modules/account/domain/account.entity';

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(
    private readonly tokenService: TokenService,
    @InjectDataSource() private readonly dataSource: DataSource,
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
      .findOne({ where: { id: payload.sub }, relations: { role: true } });
    if (!account) {
      throw new UnauthorizedException('존재하지 않는 계정입니다.');
    }

    if (account.status === AccountStatus.EXITED) {
      throw new ForbiddenException('퇴사한 계정입니다.');
    }

    if (!account.roleId) {
      throw new ForbiddenException('아직 관리자 승인을 받지 못한 계정입니다.');
    }

    this.context.set(ContextKey.ROLE, account.role);
    this.context.set(ContextKey.ACCOUNT, account);
    return true;
  }

  private extractToken(request: Request): string | null {
    const authorization = request.headers.authorization;
    if (!authorization) return null;

    const [type, token] = authorization.split(' ');
    return type === 'Bearer' && token ? token : null;
  }
}
