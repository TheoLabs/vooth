import { DddAggregate } from '@libs/ddd';
import { Permission } from '@modules/permission/domain/permission.entity';
import { Column, Entity, JoinTable, ManyToMany, PrimaryGeneratedColumn } from 'typeorm';
import { RoleType } from '@vooth/shared';

type Ctor = {
  name: string;
  type: RoleType;
};

@Entity()
export class Role extends DddAggregate {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'enum', enum: RoleType })
  type: RoleType;

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
      this.type = args.type;
      this.permissions = [];
    }
  }

  static of(args: { name: string; type: RoleType; permissions: Permission[] }) {
    const role = new Role(args);

    role.assignPermissions(args.permissions);

    return role;
  }

  assignPermissions(permissions: Permission[]) {
    this.permissions = permissions;
  }
}
