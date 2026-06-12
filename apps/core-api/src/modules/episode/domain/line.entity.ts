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

  // 연출용: 컷 내 세로 위치(0~1 정규화). 이 대사가 "발화되는 지점" → 스크롤이 여기로 맞춰진다.
  // null 이면 표시/렌더 측에서 균등 분배로 폴백.
  @Column({ type: 'decimal', precision: 8, scale: 7, transformer: decimalTransformer, nullable: true })
  anchorY?: number | null;

  // 연출용: 이 대사 앞에 두는 간격(ms, 페이싱). null=0.
  @Column({ type: 'int', nullable: true })
  gapBeforeMs?: number | null;

  // 컷 삭제 시(스크립트 재업로드의 고아 컷 포함) DB 레벨에서 라인도 함께 삭제.
  @ManyToOne(() => Cut, (cut) => cut.lines, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'cutId' })
  cut: Cut;

  private constructor(args: {
    episodeId: number;
    characterId: number;
    script: string;
    position: number;
    anchorY?: number;
    gapBeforeMs?: number;
  }) {
    super();

    if (args) {
      this.episodeId = args.episodeId;
      this.characterId = args.characterId;
      this.script = args.script;
      this.position = args.position;
      this.anchorY = args.anchorY ?? null;
      this.gapBeforeMs = args.gapBeforeMs ?? null;
    }
  }

  static of(args: {
    episodeId: number;
    characterId: number;
    script: string;
    position: number;
    anchorY?: number;
    gapBeforeMs?: number;
  }) {
    return new Line(args);
  }

  update(args: {
    characterId?: number;
    script?: string;
    position?: number;
    anchorY?: number;
    gapBeforeMs?: number;
  }) {
    const changed = this.stripUnchanged(args);

    if (!changed) {
      return;
    }

    Object.assign(this, changed);
  }
}
