import { Content } from '../content.entity';
import { ContentSpec } from './content-spec';
import { ContentRepository } from '@modules/content/infrastructure/content.repository';
import { TypeormRelationOptions } from '@libs/utils';
import { ContentStatus } from '@vooth/shared';

export class RecordableContentSpec implements ContentSpec {
  private readonly id?: number;
  private readonly searchKey?: string;
  private readonly searchValue?: string;

  constructor({ id, searchKey, searchValue }: { id?: number; searchKey?: string; searchValue?: string }) {
    this.id = id;
    this.searchKey = searchKey;
    this.searchValue = searchValue;
  }

  async satisfyElementFind(repository: ContentRepository, options?: TypeormRelationOptions<Content>) {
    return repository.find(
      {
        id: this.id,
        searchKey: this.searchKey,
        searchValue: this.searchValue,
        statuses: [ContentStatus.RECORDING, ContentStatus.PUBLISHED],
      },
      options
    );
  }

  async satisfyElementCount(repository: ContentRepository): Promise<number> {
    return repository.count({
      id: this.id,
      searchKey: this.searchKey,
      searchValue: this.searchValue,
      statuses: [ContentStatus.RECORDING, ContentStatus.PUBLISHED],
    });
  }
}
