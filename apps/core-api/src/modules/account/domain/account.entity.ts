import { DddAggregate } from '@libs/ddd';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

interface Ctor {
  googleSub: string;
  email: string;
}

@Entity()
export class Account extends DddAggregate {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  googleSub: string;

  @Column({ unique: true })
  email: string;

  private constructor(args: Ctor) {
    super();

    if (args) {
      this.googleSub = args.googleSub;
      this.email = args.email;
    }
  }
}
