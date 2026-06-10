import { DddEvent } from '@libs/ddd';

export class ContentSetTagEvent extends DddEvent {
  public readonly addedTagIds: number[];
  public readonly removedTagIds: number[];

  constructor(args: { addedTagIds: number[]; removedTagIds: number[] }) {
    super();

    if (args) {
      this.addedTagIds = args.addedTagIds;
      this.removedTagIds = args.removedTagIds;
    }
  }
}
