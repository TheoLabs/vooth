import { EpisodeRepository } from '@modules/episode/infrastructure/episode.repository';
import { Episode } from '../episode.entity';
import { TypeormRelationOptions } from '@libs/utils';

export abstract class EpisodeSpec {
  abstract satifyElementFrom(repo: EpisodeRepository, options?: TypeormRelationOptions<Episode>): Promise<Episode[]>;

  abstract satifyCountFrom(repo: EpisodeRepository): Promise<number>;
}
