import { EpisodeRepository } from '@modules/episode/infrastructure/episode.repository';
import { Episode } from '../episode.entity';
import { EpisodeSpec } from './episode-spec';
import { EpisodeStatus } from '@vooth/shared';
import { TypeormRelationOptions } from '@libs/utils';

export class RecordableEpisodeSpec implements EpisodeSpec {
  private readonly contentId?: number;

  constructor({ contentId }: { contentId?: number }) {
    this.contentId = contentId;
  }

  async satifyElementFrom(repo: EpisodeRepository, options?: TypeormRelationOptions<Episode>): Promise<Episode[]> {
    return repo.find({ contentId: this.contentId, statuses: [EpisodeStatus.READY, EpisodeStatus.RECORDING] }, options);
  }

  async satifyCountFrom(repo: EpisodeRepository): Promise<number> {
    return repo.count({ contentId: this.contentId, statuses: [EpisodeStatus.READY, EpisodeStatus.RECORDING] });
  }
}
