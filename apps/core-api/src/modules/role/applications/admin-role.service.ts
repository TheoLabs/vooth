import { DddService } from '@libs/ddd';
import { BadRequestException, Injectable } from '@nestjs/common';
import { RoleRepository } from '../infrastructure/role.repository';
import { PaginationOptions } from '@libs/utils';
import { Transactional } from '@libs/decorators';
import { PermissionRepository } from '@modules/permission/infrastructure/permission.repository';
import { Role } from '../domain/role.entity';
import { RoleType } from '@vooth/shared';
import { RoleResponseDto } from '../presentation/dto';

@Injectable()
export class AdminRoleService extends DddService {
  constructor(
    private readonly roleRepository: RoleRepository,
    private readonly permissionRepository: PermissionRepository
  ) {
    super();
  }

  @Transactional()
  async create({ name, type, permissionCodes }: { name: string; type: RoleType; permissionCodes: string[] }) {
    const [existingRole] = await this.roleRepository.find({ types: [type] });

    if (existingRole) {
      throw new BadRequestException('이미 등록된 역할군입니다.', { cause: '이미 등록된 역할군입니다.' });
    }

    const permissions = await this.permissionRepository.find({ codes: permissionCodes });

    if (permissions.length !== permissionCodes.length) {
      throw new BadRequestException('미등록된 권한이 존재합니다.', { cause: '미등록된 권한이 존재합니다' });
    }

    const role = Role.of({ name, permissions, type });

    await this.roleRepository.save([role]);
  }

  async list(
    { searchKey, searchValue, types }: { searchKey?: string; searchValue?: string; types?: RoleType[] },
    options?: PaginationOptions
  ) {
    const [roles, total] = await Promise.all([
      this.roleRepository.find({ searchKey, searchValue, types }, { options, relations: { permissions: true } }),
      this.roleRepository.count({ searchKey, searchValue, types }),
    ]);

    return { items: roles.map((role) => role.toInstance(RoleResponseDto)), total };
  }

  async retrieve({ id }: { id: number }) {
    const [role] = await this.roleRepository.find({ ids: [id] }, { relations: { permissions: true } });

    if (!role) {
      throw new BadRequestException('존재하지 않는 역할입니다.', { cause: '존재하지 않는 역할입니다.' });
    }

    return role.toInstance(RoleResponseDto);
  }

  @Transactional()
  async update({ id, permissionCodes }: { id: number; permissionCodes: string[] }) {
    const [role] = await this.roleRepository.find({ ids: [id] }, { relations: { permissions: true } });

    if (!role) {
      throw new BadRequestException('존재하지 않는 역할입니다.', { cause: '존재하지 않는 역할입니다.' });
    }

    const permissions = await this.permissionRepository.find({ codes: permissionCodes });

    if (permissions.length !== permissionCodes.length) {
      throw new BadRequestException('미등록된 권한이 존재합니다.', { cause: '미등록된 권한이 존재합니다' });
    }

    role.assignPermissions(permissions);

    await this.roleRepository.save([role]);
  }
}
