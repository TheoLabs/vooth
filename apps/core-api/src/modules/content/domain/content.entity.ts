import { DddAggregate } from '@libs/ddd';
import { Tag } from '@modules/tag/domain/tag.entity';
import {
  CalendarDate,
  canManualTransitionContent,
  canTransitionContent,
  ContentStatus,
  type CropBox,
} from '@vooth/shared';
import { Column, Entity, JoinTable, ManyToMany, PrimaryGeneratedColumn } from 'typeorm';
import { ContentSetTagEvent } from './events';
import { BadRequestException } from '@nestjs/common';

type Ctor = {
  title: string;
  description: string;
  thumbnailFileId: number;
  thumbnailCropBox: CropBox;
  tags: Tag[];
};

@Entity()
export class Content extends DddAggregate {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  thumbnailFileId: number;

  @Column({ type: 'json' })
  thumbnailCropBox: CropBox;

  @Column({ unique: true })
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'enum', enum: ContentStatus })
  status: ContentStatus;

  @Column({ type: 'varchar', length: 100, nullable: true })
  expectedPublishOn: CalendarDate | null;

  @Column()
  episodeCount: number;

  @ManyToMany(() => Tag)
  @JoinTable({
    name: 'content_tag',
    joinColumn: { name: 'contentId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'tagId', referencedColumnName: 'id' },
  })
  tags: Tag[];

  private constructor(args: Omit<Ctor, 'tags'>) {
    super();

    if (args) {
      this.title = args.title;
      this.description = args.description;
      this.thumbnailFileId = args.thumbnailFileId;
      this.thumbnailCropBox = args.thumbnailCropBox;
      this.status = ContentStatus.DRAFT;
      this.tags = [];
      this.episodeCount = 0;
    }
  }

  static of(args: Ctor) {
    const content = new Content(args);

    content.setTags(args.tags);

    return content;
  }

  setTags(tags: Tag[]) {
    const oldTagIds = new Set(this.tags.map((t) => t.id));
    const newTagIds = new Set(tags.map((t) => t.id));

    const removedTagIds = [...oldTagIds].filter((id) => !newTagIds.has(id));
    const addedTagIds = [...newTagIds].filter((id) => !oldTagIds.has(id));

    this.tags = tags;

    if (addedTagIds.length > 0 || removedTagIds.length > 0) {
      this.publishEvent(new ContentSetTagEvent({ addedTagIds, removedTagIds }));
    }
  }

  update(args: {
    title?: string;
    description?: string;
    thumbnailFileId?: number;
    thumbnailCropBox?: CropBox;
    episodeCount?: number;
  }) {
    const changed = this.stripUnchanged(args);

    if (!changed) {
      return;
    }

    Object.assign(this, changed);
  }

  remove() {
    if (this.status !== ContentStatus.DRAFT) {
      throw new BadRequestException('초안 상태인 컨텐츠만 삭제 가능합니다.', {
        cause: '초안 상태인 컨텐츠만 삭제 가능합니다. 개발팀에 문의주세요.',
      });
    }

    this.deletedAt = new Date();
    this.publishEvent(new ContentSetTagEvent({ addedTagIds: [], removedTagIds: this.tags.map((t) => t.id) }));
  }

  transitionTo(nextStatus: ContentStatus) {
    if (!canTransitionContent(this.status, nextStatus)) {
      throw new BadRequestException(`잘못된 상태 변경입니다. ${this.status} -> ${nextStatus}`, {
        cause: `잘못된 상태 변경입니다. 개발팀에게 문의주세요. ${this.status} -> ${nextStatus}`,
      });
    }

    this.status = nextStatus;
  }

  /** 관리자 수동 상태 전이. 자동·스케줄러·데이터 기반 전이는 거부한다. */
  transitionManually(nextStatus: ContentStatus) {
    if (!canManualTransitionContent(this.status, nextStatus)) {
      throw new BadRequestException(`수동으로 변경할 수 없는 상태입니다. ${this.status} -> ${nextStatus}`, {
        cause: `수동으로 변경할 수 없는 상태입니다. 개발팀에게 문의주세요. ${this.status} -> ${nextStatus}`,
      });
    }

    this.status = nextStatus;
  }
}
