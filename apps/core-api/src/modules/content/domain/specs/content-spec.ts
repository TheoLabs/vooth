import { ContentRepository } from '@modules/content/infrastructure/content.repository';
import { Content } from '../content.entity';
import { TypeormRelationOptions } from '@libs/utils';

export abstract class ContentSpec {
  abstract satisfyElementFrom(
    repository: ContentRepository,
    options?: TypeormRelationOptions<Content>
  ): Promise<Content[]>;

  abstract satisfyCountFrom(repository: ContentRepository): Promise<number>;
}
