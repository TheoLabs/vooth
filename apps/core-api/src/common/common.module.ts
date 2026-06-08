import { Global, Module } from '@nestjs/common';
import { ContextModule } from './context';
import { JwtTokenModule } from './jwt';

@Global()
@Module({
  imports: [ContextModule, JwtTokenModule],
  exports: [ContextModule, JwtTokenModule],
})
export class CommonModule {}
