import { Module } from '@nestjs/common';
import { RoleRepository } from './infrastructure/role.repository';

@Module({
  imports: [],
  controllers: [],
  providers: [RoleRepository],
  exports: [RoleRepository],
})
export class RoleModule {}
