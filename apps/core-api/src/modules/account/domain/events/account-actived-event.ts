import { DddEvent } from '@libs/ddd';

export class AccountActivedEvent extends DddEvent {
  public readonly accountId: number;

  constructor(args: { accountId: number }) {
    super();

    if (args) {
      this.accountId = args.accountId;
    }
  }
}
