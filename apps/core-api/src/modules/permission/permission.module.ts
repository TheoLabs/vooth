import { Module } from '@nestjs/common';
import { PermissionRepository } from './infrastructure/permission.repository';
import { AdminPermissionController } from './presentation/admin-permission.controller';
import { AdminPermissionService } from './applications/admin-permission.service';

@Module({
  imports: [],
  controllers: [AdminPermissionController],
  providers: [PermissionRepository, AdminPermissionService],
  exports: [PermissionRepository, AdminPermissionService],
})
export class PermissionModule {}
