import { DddAggregate } from '@libs/ddd';
import { Role } from '@modules/role/domain/role.entity';
import { BadRequestException } from '@nestjs/common';
import { AccountStatus, AccountType } from '@vooth/shared';
import { Column, Entity, Index, JoinColumn, OneToOne, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { AccountActivedEvent } from './events';

interface Ctor {
  googleSub: string;
  email: string;
  name: string;
  type: AccountType;
}

@Entity()
@Index('idx_account_role_id', ['roleId'])
@Unique('idx_account_google_sub_type', ['googleSub', 'type'])
export class Account extends DddAggregate {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', nullable: true })
  roleId: number | null;

  @Column({ type: 'enum', enum: AccountType })
  type: AccountType;

  @Column({ type: 'enum', enum: AccountStatus })
  status: AccountStatus;

  @Column()
  googleSub: string;

  @Column()
  email: string;

  @Column()
  name: string;

  @OneToOne(() => Role, { createForeignKeyConstraints: false, nullable: true })
  @JoinColumn({ name: 'roleId' })
  role: Role | null;

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

    return account;
  }

  changeRole(roleId: number) {
    if (this.status !== AccountStatus.ACTIVE) {
      throw new BadRequestException('승인된 계정만 역할을 변경할 수 있습니다.', {
        cause: '승인된 계정만 역할을 변경할 수 있습니다.',
      });
    }

    this.roleId = roleId;
  }

  reject() {
    if (this.status !== AccountStatus.PENDING) {
      throw new BadRequestException('대기중인 계정만 거절할 수 있습니다.', {
        cause: '대기중인 계정만 거절할 수 있습니다.',
      });
    }

    this.status = AccountStatus.REJECTED;
  }

  active(roleId: number) {
    if (this.status !== AccountStatus.PENDING) {
      throw new BadRequestException('승인 대기중인 계정만 승인할 수 있습니다.', {
        cause: '승인 대기중인 계정만 승인할 수 있습니다.',
      });
    }

    this.status = AccountStatus.ACTIVE;
    this.roleId = roleId;

    this.publishEvent(new AccountActivedEvent({ accountId: this.id }));
  }

  exit() {
    if (this.status !== AccountStatus.ACTIVE) {
      throw new BadRequestException('승인된 계정만 탈퇴할 수 있습니다.', {
        cause: '승인된 계정만 탈퇴할 수 있습니다.',
      });
    }

    this.status = AccountStatus.EXITED;
    this.roleId = null;
  }
}
