import { DddEvent } from '@libs/ddd';

export class ReviewCreatedEvent extends DddEvent {
  public readonly reviewId: number;
  public readonly episodeId: number;

  constructor(args: { reviewId: number; episodeId: number }) {
    super();

    if (args) {
      this.reviewId = args.reviewId;
      this.episodeId = args.episodeId;
    }
  }
}
