import { Module } from '@nestjs/common';
import { PermissionRepository } from './infrastructure/permission.repository';

@Module({
  imports: [],
  controllers: [],
  providers: [PermissionRepository],
  exports: [PermissionRepository],
})
export class PermissionModule {}
