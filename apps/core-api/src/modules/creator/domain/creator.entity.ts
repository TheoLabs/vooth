import { DddAggregate } from '@libs/ddd';
import { Account } from '@modules/account/domain/account.entity';
import { Column, Entity, Index, JoinColumn, OneToOne, PrimaryGeneratedColumn } from 'typeorm';

type Ctor = {
  accountId: number;
  nickname: string;
};

@Entity()
@Index('idx_creator_account_id', ['accountId'], { unique: true })
export class Creator extends DddAggregate {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  accountId: number;

  @Column()
  nickname: string;

  @Column({ type: 'int', nullable: true })
  avatarFileId: number | null;

  @Column({ type: 'text', nullable: true })
  bio: string | null;

  @OneToOne(() => Account, { createForeignKeyConstraints: false })
  @JoinColumn({ name: 'accountId' })
  account: Account;

  private constructor(args: Ctor) {
    super();

    if (args) {
      this.accountId = args.accountId;
      this.nickname = args.nickname;
    }
  }

  static of(args: Ctor) {
    return new Creator(args);
  }
}
