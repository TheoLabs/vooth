import { DddAggregate } from '@libs/ddd';
import { Permission } from '@modules/permission/domain/permission.entity';
import { Column, Entity, JoinTable, ManyToMany, PrimaryGeneratedColumn } from 'typeorm';

type Ctor = {
  name: string;
};

@Entity()
export class Role extends DddAggregate {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @ManyToMany(() => Permission, { cascade: true })
  @JoinTable({
    name: 'role_permissions',
    joinColumn: { name: 'roleId' },
    inverseJoinColumn: { name: 'codeId' },
  })
  permissions: Permission[];

  private constructor(args: Ctor) {
    super();

    if (args) {
      this.name = args.name;
    }
  }
}
