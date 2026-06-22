import { DddAggregate } from '@libs/ddd';
import { BadRequestException } from '@nestjs/common';
import { CalendarDate, type CropBox, EpisodeStatus } from '@vooth/shared';
import { AfterInsert, Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';
import { EpisodeCreatedEvent, EpisodeRemovedEvent } from './events';

type Ctor = {
  contentId: number;
  thumbnailFileId?: number;
  thumbnailCropBox?: CropBox;
  title: string;
  chapter: number;
};

@Entity()
@Index('idx_episode_content_id_chapter', ['contentId', 'chapter'], { unique: true })
export class Episode extends DddAggregate {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  contentId: number;

  @Column({ type: 'enum', enum: EpisodeStatus })
  status: EpisodeStatus;

  @Column({ type: 'int', nullable: true })
  thumbnailFileId: number | null;

  @Column({ type: 'json', nullable: true })
  thumbnailCropBox: CropBox | null;

  @Column()
  title: string;

  @Column()
  chapter: number;

  @Column()
  isFree: boolean;

  @Column({ type: 'varchar', length: 100, nullable: true })
  expectedPublishOn: CalendarDate | null;

  @AfterInsert()
  private afterInsert() {
    this.publishEvent(new EpisodeCreatedEvent({ episodeId: this.id, contentId: this.contentId }));
  }

  private constructor(args: Ctor) {
    super();

    if (args) {
      this.contentId = args.contentId;
      this.thumbnailFileId = args.thumbnailFileId ?? null;
      this.thumbnailCropBox = args.thumbnailCropBox ?? null;
      this.status = EpisodeStatus.DRAFT;
      this.title = args.title;
      this.chapter = args.chapter;
      this.isFree = this.chapter < 2;
    }
  }

  static of(args: Ctor) {
    if (args.chapter < 0) {
      throw new BadRequestException('회차는 0화보다 작을 수 없습니다.', { cause: '회차는 0화보다 작을 수 없습니다.' });
    }

    return new Episode(args);
  }

  update(args: {
    thumbnailFileId?: number | null;
    thumbnailCropBox?: CropBox | null;
    title?: string;
    isFree?: boolean;
    expectedPublishOn?: CalendarDate | null;
  }) {
    const changed = this.stripUnchanged(args);

    if (!changed) {
      return;
    }

    Object.assign(this, changed);

    if (args.expectedPublishOn) {
      if (this.status === EpisodeStatus.APPROVED) {
        this.status = EpisodeStatus.SCHEDULED;
      }
    }

    if (args.expectedPublishOn === null) {
      if (this.status === EpisodeStatus.SCHEDULED) {
        this.status = EpisodeStatus.APPROVED;
      }
    }
  }

  /**
   * Cut, Line과 같은 엔티티들은 성우/이용자에게 제공된 시점에서는 임의로 변경할 순 없음.
   * Episode의 간단한 정보를 업데이트하는 경우는 제외한다.
   * 추후 Suspend 상태도 가능하게 만들어야 할 수 있음 <- 검토 필요.
   */
  validateChildEditable() {
    if (this.status !== EpisodeStatus.DRAFT) {
      throw new BadRequestException('초안 상태의 회차만 생성/수정/삭제 할 수 있습니다.', {
        cause: '초안 상태의 회차만 생성/수정/삭제 할 수 있습니다.',
      });
    }
  }

  remove() {
    if (this.status !== EpisodeStatus.DRAFT) {
      throw new BadRequestException('draft 상태의 에피소드만 삭제할 수 있습니다.', {
        cause: 'draft 상태의 에피소드만 삭제할 수 있습니다.',
      });
    }

    this.publishEvent(new EpisodeRemovedEvent({ episodeId: this.id, contentId: this.contentId }));
  }
}
