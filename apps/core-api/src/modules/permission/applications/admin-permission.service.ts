import { DddService } from '@libs/ddd';
import { Injectable } from '@nestjs/common';
import { PermissionRepository } from '../infrastructure/permission.repository';
import { PaginationOptions } from '@libs/utils';
import { PermissionCategory } from '@vooth/shared';
import { PermissionResponseDto } from '../presentation/dto';

@Injectable()
export class AdminPermissionService extends DddService {
  constructor(private readonly permissionRepository: PermissionRepository) {
    super();
  }

  async list(
    {
      searchKey,
      searchValue,
      categories,
    }: {
      searchKey?: string;
      searchValue?: string;
      categories?: PermissionCategory[];
    },
    options?: PaginationOptions
  ) {
    const [permissions, total] = await Promise.all([
      this.permissionRepository.find({ searchKey, searchValue, categories }, { options }),
      this.permissionRepository.count({ searchKey, searchValue, categories }),
    ]);

    return { items: permissions.map((permission) => permission.toInstance(PermissionResponseDto)), total };
  }
}
