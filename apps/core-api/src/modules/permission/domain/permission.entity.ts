import { DddAggregate } from '@libs/ddd';
import { PermissionCategory } from '@vooth/shared';
import { Column, Entity, PrimaryColumn } from 'typeorm';

type Ctor = {
  code: string;
  name: string;
  category: PermissionCategory;
  description: string;
};

@Entity()
export class Permission extends DddAggregate {
  @PrimaryColumn()
  code: string;

  @Column()
  name: string;

  @Column({ type: 'enum', enum: PermissionCategory })
  category: PermissionCategory;

  @Column({ length: 400 })
  description: string;

  private constructor(args: Ctor) {
    super();

    if (args) {
      this.code = args.code;
      this.name = args.name;
      this.category = args.category;
      this.description = args.description;
    }
  }

  static of(args: Ctor) {
    return new Permission(args);
  }
}
