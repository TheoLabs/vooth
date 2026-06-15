import { EpisodeRepository } from '@modules/episode/infrastructure/episode.repository';
import { Episode } from '../episode.entity';
import { EpisodeSpec } from './episode-spec';
import { EpisodeStatus } from '@vooth/shared';
import { TypeormRelationOptions } from '@libs/utils';

export class RecordableEpisodeSpec implements EpisodeSpec {
  private readonly id?: number;
  private readonly contentId?: number;

  constructor({ id, contentId }: { id?: number; contentId?: number }) {
    this.id = id;
    this.contentId = contentId;
  }

  async satifyElementFrom(repo: EpisodeRepository, options?: TypeormRelationOptions<Episode>): Promise<Episode[]> {
    return repo.find(
      {
        id: this.id,
        contentId: this.contentId,
        statuses: [EpisodeStatus.READY, EpisodeStatus.RECORDING, EpisodeStatus.REVIEWING],
      },
      options
    );
  }

  async satifyCountFrom(repo: EpisodeRepository): Promise<number> {
    return repo.count({
      id: this.id,
      contentId: this.contentId,
      statuses: [EpisodeStatus.READY, EpisodeStatus.RECORDING, EpisodeStatus.REVIEWING],
    });
  }
}
