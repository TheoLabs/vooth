import { DddAggregate } from '@libs/ddd';
import { Column, Entity, PrimaryColumn } from 'typeorm';

type Ctor = {
  code: string;
  name: string;
  description: string;
};

@Entity()
export class Permission extends DddAggregate {
  @PrimaryColumn()
  code: string;

  @Column()
  name: string;

  @Column({ length: 400 })
  description: string;

  private constructor(args: Ctor) {
    super();

    if (args) {
      this.code = args.code;
      this.name = args.name;
      this.description = args.description;
    }
  }

  static of(args: Ctor) {
    return new Permission(args);
  }
}
