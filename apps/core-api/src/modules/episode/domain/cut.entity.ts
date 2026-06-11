import { DddAggregate } from '@libs/ddd';
import { decimalTransformer } from '@libs/utils';
import { Column, Entity, Index, ManyToOne, OneToMany, PrimaryGeneratedColumn, JoinColumn } from 'typeorm';
import { Line } from './line.entity';
import { Episode } from './episode.entity';

@Entity()
@Index('idx_cut_episode_id', ['episodeId'])
export class Cut extends DddAggregate {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  episodeId: number;

  @Column({ type: 'decimal', precision: 20, scale: 10, transformer: decimalTransformer })
  position: number;

  @Column({ type: 'varchar', length: 512 })
  imageUrl: string;

  // 회차 삭제 시 DB 레벨에서 컷도 함께 삭제(컷의 라인은 다시 line→cut CASCADE 로 정리).
  @ManyToOne(() => Episode, (episode) => episode.cuts, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'episodeId' })
  episode: Episode;

  // 스크립트 교체 시 빠진 대사는 삭제한다(고아 제거).
  @OneToMany(() => Line, (line) => line.cut, { cascade: true, orphanedRowAction: 'delete' })
  lines: Line[];

  private constructor(args: { episodeId: number; position: number; imageUrl: string }) {
    super();

    if (args) {
      this.episodeId = args.episodeId;
      this.position = args.position;
      this.imageUrl = args.imageUrl;
      this.lines = [];
    }
  }

  static of(args: { episodeId: number; position: number; imageUrl: string }) {
    return new Cut(args);
  }

  update(args: { position?: number; imageUrl?: string }) {
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
