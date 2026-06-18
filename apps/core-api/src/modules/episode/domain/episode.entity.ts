import { DddAggregate } from '@libs/ddd';
import { BadRequestException } from '@nestjs/common';
import { CalendarDate, type CropBox, EpisodeStatus } from '@vooth/shared';
import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

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
}
