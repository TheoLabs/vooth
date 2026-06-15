import { DddEvent } from '@libs/ddd';

export class RecordingCreatedEvent extends DddEvent {
  public readonly recordingId: number;
  public readonly episodeId: number;

  constructor(args: { recordingId: number; episodeId: number }) {
    super();

    if (args) {
      this.recordingId = args.recordingId;
      this.episodeId = args.episodeId;
    }
  }
}
