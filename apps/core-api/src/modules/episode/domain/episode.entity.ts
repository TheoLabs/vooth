import { DddAggregate } from '@libs/ddd';
import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';
import { EpisodeStatus } from '@vooth/shared';

type Ctor = {
  contentId: number;
  title: string;
  chapter: number;
};

@Entity()
@Index('idx_episode_content_id', ['contentId'])
export class Episode extends DddAggregate {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  contentId: number;

  @Column()
  title: string;

  @Column()
  chapter: number;

  // 정렬 가능한 숫자 enum(편집중 10 … 발행 60) → smallint 로 저장.
  @Column({ type: 'smallint' })
  status: EpisodeStatus;

  private constructor(args: Ctor) {
    super();

    if (args) {
      this.contentId = args.contentId;
      this.title = args.title;
      this.status = EpisodeStatus.DRAFT;
      this.chapter = args.chapter;
    }
  }

  static of(args: Ctor) {
    return new Episode(args);
  }

  update(args: { title?: string; chapter?: number; status?: EpisodeStatus }) {
    const changed = this.stripUnchanged(args);

    if (!changed) {
      return;
    }

    Object.assign(this, changed);
  }
}
