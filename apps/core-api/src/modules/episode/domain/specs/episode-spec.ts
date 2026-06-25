import { EpisodeRepository } from '@modules/episode/infrastructure/episode.repository';
import { Episode } from '../episode.entity';
import { TypeormRelationOptions } from '@libs/utils';

export abstract class EpisodeSpec {
  abstract satisfyElementFrom(
    repository: EpisodeRepository,
    options?: TypeormRelationOptions<Episode>
  ): Promise<Episode[]>;

  abstract satisfyCountFrom(repository: EpisodeRepository): Promise<number>;
}
