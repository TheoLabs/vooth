import { TypeormRelationOptions } from '@libs/utils';
import { ContentRepository } from '@modules/content/infrastructure/content.repository';
import { Content } from '../content.entity';
import { ContentSpec } from './content-spec';
import { ContentStatus } from '@vooth/shared';

export class CreatorAccessibleContentSpec implements ContentSpec {
  private readonly ids?: number[];
  private readonly searchKey?: string;
  private readonly searchValue?: string;

  constructor(args: { ids?: number[]; searchKey?: string; searchValue?: string }) {
    this.ids = args.ids;
    this.searchKey = args.searchKey;
    this.searchValue = args.searchValue;
  }

  async satisfyElementFrom(repository: ContentRepository, options?: TypeormRelationOptions<Content>) {
    return repository.find(
      {
        ids: this.ids,
        searchKey: this.searchKey,
        searchValue: this.searchValue,
        statuses: [
          ContentStatus.READY,
          ContentStatus.RECORDING,
          ContentStatus.REVIEWING,
          ContentStatus.APPROVED,
          ContentStatus.SCHEDULED,
          ContentStatus.APPROVED,
          ContentStatus.PUBLISHED,
          ContentStatus.ARCHIVED,
        ],
      },
      options
    );
  }

  async satisfyCountFrom(repository: ContentRepository) {
    return repository.count({
      ids: this.ids,
      searchKey: this.searchKey,
      searchValue: this.searchValue,
      statuses: [
        ContentStatus.READY,
        ContentStatus.RECORDING,
        ContentStatus.REVIEWING,
        ContentStatus.APPROVED,
        ContentStatus.SCHEDULED,
        ContentStatus.APPROVED,
        ContentStatus.PUBLISHED,
        ContentStatus.ARCHIVED,
      ],
    });
  }
}
