import { DddAggregate } from '@libs/ddd';
import { Content } from '@modules/content/domain/content.entity';
import { TagColor } from '@vooth/shared';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

type Ctor = {
  name: string;
  color: TagColor;
};

@Entity()
export class Tag extends DddAggregate {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ type: 'enum', enum: TagColor })
  color: TagColor;

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

  update(args: { name?: string; color?: TagColor }) {
    const changed = this.stripUnchanged(args);

    if (!changed) {
      return;
    }

    Object.assign(this, changed);
  }

  /** 사용량을 실제 집계값으로 최신화한다(증분 아님 — 멱등/무drift). */
  setUsageCount(count: number) {
    this.usageCount = count;
  }
}
