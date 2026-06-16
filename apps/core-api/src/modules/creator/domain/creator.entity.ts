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
  avartarFileId: number | null;

  @Column({ type: 'text', nullable: true })
  bio: string | null;

  @Column()
  isActive: boolean;

  @OneToOne(() => Account, { createForeignKeyConstraints: false })
  @JoinColumn({ name: 'accountId' })
  account: Account;

  private constructor(args: Ctor) {
    super();

    if (args) {
      this.accountId = args.accountId;
      this.nickname = args.nickname;
      this.isActive = false;
    }
  }

  static of(args: Ctor) {
    return new Creator(args);
  }
}
