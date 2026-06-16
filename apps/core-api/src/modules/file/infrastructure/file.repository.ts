import { DddRepository } from '@libs/ddd';
import { Injectable } from '@nestjs/common';
import { File } from '../domain/file.entity';
import { checkInValue, convertOptions, stripUndefined, TypeormRelationOptions } from '@libs/utils';

@Injectable()
export class FileRepository extends DddRepository<File> {
  entityClass = File;

  async find(conditions: { ids?: number[]; isCommit?: boolean }, options?: TypeormRelationOptions<File>) {
    return this.entityManager.find(this.entityClass, {
      where: stripUndefined({
        id: checkInValue(conditions.ids),
        isCommit: conditions.isCommit,
      }),
      ...convertOptions(options),
    });
  }
}
