import { DddAggregate } from '@libs/ddd';
import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

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

  // TODO: ENUM 으로 관리
  @Column()
  status: string;

  private constructor(args: Ctor) {
    super();

    if (args) {
      this.contentId = args.contentId;
      this.title = args.title;
      this.status = 'draft';
      this.chapter = args.chapter;
    }
  }

  static of(args: Ctor) {
    return new Episode(args);
  }
}
