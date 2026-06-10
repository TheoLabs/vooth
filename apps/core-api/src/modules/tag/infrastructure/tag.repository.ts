import { DddRepository } from '@libs/ddd';
import { Injectable } from '@nestjs/common';
import { Tag } from '../domain/tag.entity';
import { checkInValue, checkLikeValue, convertOptions, stripUndefined, TypeormRelationOptions } from '@libs/utils';
import { Content } from '@modules/content/domain/content.entity';

@Injectable()
export class TagRepository extends DddRepository<Tag> {
  entityClass = Tag;

  async find(
    conditions: { ids?: number[]; searchKey?: string; searchValue?: string; name?: string },
    options?: TypeormRelationOptions<Tag>
  ) {
    return this.entityManager.find(this.entityClass, {
      where: stripUndefined({
        id: checkInValue(conditions.ids),
        name: conditions.name,
        ...checkLikeValue({ searchKey: conditions.searchKey, searchValue: conditions.searchValue }),
      }),
      ...convertOptions(options),
    });
  }

  async count(conditions: { ids?: number[]; searchKey?: string; searchValue?: string; name?: string }) {
    return this.entityManager.count(this.entityClass, {
      where: stripUndefined({
        id: checkInValue(conditions.ids),
        name: conditions.name,
        ...checkLikeValue({ searchKey: conditions.searchKey, searchValue: conditions.searchValue }),
      }),
    });
  }

  async remove(tags: Tag[]) {
    return this.entityManager.remove(tags);
  }

  async countTagUsage(id: number) {
    return this.entityManager.count(Content, { where: { tags: { id } } });
  }
}
