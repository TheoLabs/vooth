import { DddBaseAggregate } from '@libs/ddd';
import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { Cut } from './cut.entity';
import { Anchor } from '@vooth/shared';

type Ctor = {
  characterId: number;
  script: string;
  order: number;
  anchorMetadata?: Anchor;
};

@Entity()
@Index('idx_line_character_id', ['characterId'])
@Unique('idx_line_cut_id_order', ['cutId', 'order'])
export class Line extends DddBaseAggregate {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  cutId: number;

  @Column()
  characterId: number;

  @Column({ type: 'text' })
  script: string;

  @Column()
  order: number;

  @Column({ type: 'json', nullable: true })
  anchorMetadata: Anchor | null;

  @ManyToOne(() => Cut, (cut) => cut.lines, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'cutId' })
  cut: Cut;

  private constructor(args: Ctor) {
    super();

    if (args) {
      this.characterId = args.characterId;
      this.script = args.script;
      this.order = args.order;
      this.anchorMetadata = args.anchorMetadata ?? null;
    }
  }

  static of(args: Ctor) {
    return new Line(args);
  }

  update(args: { characterId?: number; script?: string; order?: number; anchorMetadata?: Anchor | null }) {
    const changed = this.stripUnchanged(args);

    if (!changed) {
      return;
    }

    Object.assign(this, changed);
  }
}
