import { DddEvent } from '@libs/ddd';

export class EpisodeRemovedEvent extends DddEvent {
  public readonly episodeId: number;

  constructor(args: { episodeId: number }) {
    super();

    if (args) {
      this.episodeId = args.episodeId;
    }
  }
}
