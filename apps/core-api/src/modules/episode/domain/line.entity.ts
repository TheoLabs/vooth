import { DddAggregate } from '@libs/ddd';
import { decimalTransformer } from '@libs/utils';
import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Cut } from './cut.entity';

@Entity()
export class Line extends DddAggregate {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  cutId: number;

  @Column()
  episodeId: number;

  @Column()
  characterId: number;

  @Column({ type: 'decimal', precision: 20, scale: 10, transformer: decimalTransformer })
  position: number;

  @Column({ type: 'varchar', length: 800 })
  script: string;

  // 컷 삭제 시(스크립트 재업로드의 고아 컷 포함) DB 레벨에서 라인도 함께 삭제.
  @ManyToOne(() => Cut, (cut) => cut.lines, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'cutId' })
  cut: Cut;

  private constructor(args: { episodeId: number; characterId: number; script: string; position: number }) {
    super();

    if (args) {
      this.episodeId = args.episodeId;
      this.characterId = args.characterId;
      this.script = args.script;
      this.position = args.position;
    }
  }

  static of(args: { episodeId: number; characterId: number; script: string; position: number }) {
    return new Line(args);
  }

  update(args: { characterId?: number; script?: string; position?: number }) {
    const changed = this.stripUnchanged(args);

    if (!changed) {
      return;
    }

    Object.assign(this, changed);
  }
}
