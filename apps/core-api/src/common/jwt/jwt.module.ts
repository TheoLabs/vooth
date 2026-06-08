import { Module } from '@nestjs/common';
import { JwtModule as NestJwtModule } from '@nestjs/jwt';
import { TokenService } from './jwt.service';

/**
 * @nestjs/jwt 를 감싼 토큰 모듈. CommonModule(@Global) 에서 import/재export 되어
 * TokenService 가 전역에서 주입 가능하다.
 */
@Module({
  imports: [NestJwtModule.register({})],
  providers: [TokenService],
  exports: [TokenService],
})
export class JwtTokenModule {}
