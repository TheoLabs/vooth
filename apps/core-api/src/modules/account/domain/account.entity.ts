import { DddAggregate } from '@libs/ddd';
import { Role } from '@modules/role/domain/role.entity';
import { AccountStatus, AccountType } from '@vooth/shared';
import { Column, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn } from 'typeorm';

interface Ctor {
  googleSub: string;
  email: string;
  name: string;
  type: AccountType;
}

@Entity()
export class Account extends DddAggregate {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', nullable: true })
  roleId?: number | null;

  @Column({ type: 'enum', enum: AccountType })
  type: AccountType;

  @Column({ type: 'enum', enum: AccountStatus })
  status: AccountStatus;

  @Column({ unique: true })
  googleSub: string;

  @Column({ unique: true })
  email: string;

  @Column()
  name: string;

  @OneToOne(() => Role, { createForeignKeyConstraints: false, nullable: true })
  @JoinColumn({ name: 'roleId' })
  role?: Role;

  private constructor(args: Ctor) {
    super();

    if (args) {
      this.googleSub = args.googleSub;
      this.email = args.email;
      this.name = args.name;
      this.type = args.type;
      this.status = AccountStatus.PENDING;
    }
  }

  static of(args: Ctor): Account {
    const account = new Account(args);

    if (args.type === AccountType.ADMIN) {
      account.active();
    }

    return account;
  }

  active() {
    this.status = AccountStatus.ACTIVE;
  }
}
