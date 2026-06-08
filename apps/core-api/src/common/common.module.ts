import { Global, Module } from '@nestjs/common';
import { ContextModule } from './context';

@Global()
@Module({
  imports: [ContextModule],
  exports: [ContextModule],
})
export class CommonModule {}
