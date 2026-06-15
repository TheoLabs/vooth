import { DddAggregate } from '@libs/ddd';
import { AfterInsert, Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';
import { type CalendarDate, ReviewStatus } from '@vooth/shared';
import { ReviewCreatedEvent } from './events';

type Ctor = {
  contentId: number;
  episodeId: number;
  creatorId: number;
};

@Entity()
@Index('idx_review_episode_id_creator_id', ['episodeId', 'creatorId'], { unique: true })
export class Review extends DddAggregate {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  contentId: number;

  @Column()
  episodeId: number;

  @Column()
  creatorId: number;

  @Column({ type: 'smallint', comment: '10: 검수대기, 20: 검수완료(승인), 30: 검수보류(반려)' })
  status: ReviewStatus;

  @Column({ type: 'int', nullable: true, comment: '검수자 id' })
  reviewerId?: number | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  rejectReason?: string | null;

  @Column({ type: 'varchar', nullable: true })
  reviewedOn?: CalendarDate | null;

  @AfterInsert()
  private afterInsert() {
    this.publishEvent(new ReviewCreatedEvent({ reviewId: this.id, episodeId: this.episodeId }));
  }

  private constructor(args: Ctor) {
    super();

    if (args) {
      this.contentId = args.contentId;
      this.episodeId = args.episodeId;
      this.creatorId = args.creatorId;

      this.status = ReviewStatus.REQUESTED;
    }
  }

  static of(args: Ctor) {
    return new Review(args);
  }
}
