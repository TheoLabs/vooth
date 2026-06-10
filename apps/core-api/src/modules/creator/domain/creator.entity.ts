import { DddAggregate } from '@libs/ddd';
import { Account } from '@modules/account/domain/account.entity';
import { Column, Entity, Index, JoinColumn, OneToOne, PrimaryGeneratedColumn } from 'typeorm';

type Ctor = {
  accountId: number;
  profileImageUrl?: string;
  bio?: string;
};

@Entity()
@Index('idx_creator_account_id', ['accountId'])
export class Creator extends DddAggregate {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  accountId: number;

  @Column({ type: 'varchar', length: 400, nullable: true })
  profileImageUrl?: string | null;

  @Column({ type: 'text', nullable: true })
  bio?: string | null;

  @OneToOne(() => Account, { createForeignKeyConstraints: false })
  @JoinColumn({ name: 'accountId' })
  account: Account;

  private constructor(args: Ctor) {
    super();

    if (args) {
      this.accountId = args.accountId;
      this.profileImageUrl = args.profileImageUrl;
      this.bio = args.bio;
    }
  }

  static of(args: Ctor) {
    return new Creator(args);
  }
}
