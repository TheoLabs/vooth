import { DddAggregate } from '@libs/ddd';
import { decimalTransformer } from '@libs/utils';
import { Column, Entity, Index, ManyToOne, OneToMany, PrimaryGeneratedColumn, JoinColumn } from 'typeorm';
import { Line } from './line.entity';
import { Episode } from './episode.entity';

/** 표시용 정규화 크롭 박스(0~1). 원본에서 16:10 등으로 보여줄 focal 영역. */
export interface CropBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

@Entity()
@Index('idx_cut_episode_id', ['episodeId'])
export class Cut extends DddAggregate {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  episodeId: number;

  @Column({ type: 'decimal', precision: 20, scale: 10, transformer: decimalTransformer })
  position: number;

  // 원본 이미지 URL(렌더의 진실 공급원). 16:10 표시는 cropBox 로 CSS 유도.
  @Column({ type: 'varchar', length: 512 })
  imageUrl: string;

  // 원본 자연 크기(px). 연속 캔버스/영상 렌더에 필요.
  @Column({ type: 'int', nullable: true })
  imageWidth?: number | null;

  @Column({ type: 'int', nullable: true })
  imageHeight?: number | null;

  // 표시용 16:10 영역(정규화). 없으면 표시 측에서 cover 폴백.
  @Column({ type: 'json', nullable: true })
  cropBox?: CropBox | null;

  // 연출용: 컷의 마지막 대사 뒤 머무는 시간(ms). null=0.
  @Column({ type: 'int', nullable: true })
  holdMs?: number | null;

  // 회차 삭제 시 DB 레벨에서 컷도 함께 삭제(컷의 라인은 다시 line→cut CASCADE 로 정리).
  @ManyToOne(() => Episode, (episode) => episode.cuts, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'episodeId' })
  episode: Episode;

  // 스크립트 교체 시 빠진 대사는 삭제한다(고아 제거).
  @OneToMany(() => Line, (line) => line.cut, { cascade: true, orphanedRowAction: 'delete' })
  lines: Line[];

  private constructor(args: {
    episodeId: number;
    position: number;
    imageUrl: string;
    imageWidth?: number;
    imageHeight?: number;
    cropBox?: CropBox;
    holdMs?: number;
  }) {
    super();

    if (args) {
      this.episodeId = args.episodeId;
      this.position = args.position;
      this.imageUrl = args.imageUrl;
      this.imageWidth = args.imageWidth ?? null;
      this.imageHeight = args.imageHeight ?? null;
      this.cropBox = args.cropBox ?? null;
      this.holdMs = args.holdMs ?? null;
      this.lines = [];
    }
  }

  static of(args: {
    episodeId: number;
    position: number;
    imageUrl: string;
    imageWidth?: number;
    imageHeight?: number;
    cropBox?: CropBox;
    holdMs?: number;
  }) {
    return new Cut(args);
  }

  update(args: {
    position?: number;
    imageUrl?: string;
    imageWidth?: number;
    imageHeight?: number;
    cropBox?: CropBox;
    holdMs?: number;
  }) {
    const changed = this.stripUnchanged(args);

    if (!changed) {
      return;
    }

    Object.assign(this, changed);
  }

  setLines(lines: Line[]) {
    this.lines = lines;
  }
}
