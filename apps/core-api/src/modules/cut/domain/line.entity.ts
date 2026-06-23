import { DddBaseAggregate } from '@libs/ddd';
import { BadRequestException } from '@nestjs/common';
import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { Cut } from './cut.entity';
import { Anchor } from '@vooth/shared';

type Ctor = {
  characterId: number;
  script: string;
  order: number;
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

  /** 발화 지점의 컷 내 세로 위치(0~1, null=균등 분배 폴백). 연출(directors)에서 설정. */
  @Column({ type: 'float', nullable: true })
  anchorY: number | null;

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
      this.anchorY = null;
      this.anchorMetadata = null;
    }
  }

  static of(args: Ctor) {
    return new Line(args);
  }

  update(args: {
    characterId?: number;
    script?: string;
    order?: number;
    anchorY?: number | null;
    anchorMetadata?: Anchor | null;
  }) {
    if (args.anchorY != null && (args.anchorY < 0 || args.anchorY > 1)) {
      throw new BadRequestException('대사 앵커(anchorY)는 0~1 사이의 값이어야 합니다.', {
        cause: '대사 앵커(anchorY)는 0~1 사이의 값이어야 합니다.',
      });
    }

    const changed = this.stripUnchanged(args);

    if (!changed) {
      return;
    }

    Object.assign(this, changed);
  }
}
