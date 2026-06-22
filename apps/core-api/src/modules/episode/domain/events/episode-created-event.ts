import { DddEvent } from '@libs/ddd';

export class EpisodeCreatedEvent extends DddEvent {
  public readonly episodeId: number;
  public readonly contentId: number;

  constructor(args: { episodeId: number; contentId: number }) {
    super();

    if (args) {
      this.episodeId = args.episodeId;
      this.contentId = args.contentId;
    }
  }
}
