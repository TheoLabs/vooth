import { DddService } from '@libs/ddd';
import { BadRequestException, Injectable } from '@nestjs/common';
import { RoleRepository } from '../infrastructure/role.repository';
import { PaginationOptions } from '@libs/utils';
import { Transactional } from '@libs/decorators';
import { PermissionRepository } from '@modules/permission/infrastructure/permission.repository';
import { Role } from '../domain/role.entity';

@Injectable()
export class AdminRoleService extends DddService {
  constructor(
    private readonly roleRepository: RoleRepository,
    private readonly permissionRepository: PermissionRepository
  ) {
    super();
  }

  @Transactional()
  async create({ name, permissionCodes }: { name: string; permissionCodes: string[] }) {
    const [existingRole] = await this.roleRepository.find({ name });

    if (existingRole) {
      throw new BadRequestException('이미 등록된 역할군입니다.', { cause: '이미 등록된 역할군입니다.' });
    }

    const permissions = await this.permissionRepository.find({ codes: permissionCodes });

    if (permissions.length !== permissionCodes.length) {
      throw new BadRequestException('미등록된 권한이 존재합니다.', { cause: '미등록된 권한이 존재합니다' });
    }

    const role = Role.of({ name, permissions });

    await this.roleRepository.save([role]);
  }

  async list({ searchKey, searchValue }: { searchKey?: string; searchValue?: string }, options?: PaginationOptions) {
    const [roles, total] = await Promise.all([
      this.roleRepository.find({ searchKey, searchValue }, { options }),
      this.roleRepository.count({ searchKey, searchValue }),
    ]);

    return { items: roles, total };
  }
}
