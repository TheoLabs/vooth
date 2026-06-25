import { EpisodeRepository } from '@modules/episode/infrastructure/episode.repository';
import { EpisodeSpec } from './episode-spec';
import { EpisodeStatus } from '@vooth/shared';

export class RecordableEpisodeSpec extends EpisodeSpec {
  private readonly ids?: number[];

  constructor(args: { ids?: number[] }) {
    super();
    this.ids = args.ids;
  }

  async satisfyElementFrom(repository: EpisodeRepository) {
    return repository.find({ ids: this.ids, statuses: [EpisodeStatus.READY, EpisodeStatus.RECORDING] });
  }

  async satisfyCountFrom(repository: EpisodeRepository) {
    return repository.count({ ids: this.ids, statuses: [EpisodeStatus.READY, EpisodeStatus.RECORDING] });
  }
}
