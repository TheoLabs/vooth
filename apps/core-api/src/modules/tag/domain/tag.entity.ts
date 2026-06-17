import { DddAggregate } from '@libs/ddd';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

type Ctor = {
  name: string;
  color: string;
};

@Entity()
export class Tag extends DddAggregate {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  name: string;

  @Column()
  color: string;

  @Column()
  usageCount: number;

  private constructor(args: Ctor) {
    super();

    if (args) {
      this.name = args.name;
      this.color = args.color;
      this.usageCount = 0;
    }
  }

  static of(args: Ctor) {
    return new Tag(args);
  }

  update(args: { name?: string; color?: string }) {
    const changed = this.stripUnchanged(args);

    if (!changed) {
      return;
    }

    Object.assign(this, changed);
  }

  setUsageCount(usageCount: number) {
    this.usageCount = usageCount;
  }
}
