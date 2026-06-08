import { DddAggregate } from '@libs/ddd';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

type Ctor = {
  name: string;
};

@Entity()
export class Role extends DddAggregate {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  private constructor(args: Ctor) {
    super();

    if (args) {
      this.name = args.name;
    }
  }
}
