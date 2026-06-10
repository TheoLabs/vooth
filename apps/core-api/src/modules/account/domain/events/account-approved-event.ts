import { DddEvent } from '@libs/ddd';

export class AccountApprovedEvent extends DddEvent {
  public readonly accountId: number;

  constructor(args: { accountId: number }) {
    super();

    if (args) {
      this.accountId = args.accountId;
    }
  }
}
