import { ContentRepository } from '@modules/content/infrastructure/content.repository';
import { Content } from '../content.entity';
import { TypeormRelationOptions } from '@libs/utils';

export abstract class ContentSpec {
  abstract satisfyElementFind(
    repository: ContentRepository,
    options?: TypeormRelationOptions<Content>
  ): Promise<Content[]>;

  abstract satisfyElementCount(repository: ContentRepository): Promise<number>;
}
