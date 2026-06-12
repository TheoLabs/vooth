import { DddAggregate } from '@libs/ddd';
import { Column, Entity, JoinTable, ManyToMany, PrimaryGeneratedColumn } from 'typeorm';
import { canTransitionContent, CONTENT_STATUS_LABEL, ContentStatus } from '@vooth/shared';
import { Tag } from '@modules/tag/domain/tag.entity';
import { ContentSetTagEvent } from './events';
import { BadRequestException } from '@nestjs/common';
import { type CalendarDate } from '@vooth/shared';

type Ctor = {
  thumbnailImageUrl: string;
  title: string;
  description: string;
};

@Entity()
export class Content extends DddAggregate {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 400 })
  thumbnailImageUrl: string;

  @Column({ length: 400 })
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'enum', enum: ContentStatus })
  status: ContentStatus;

  @Column({ type: 'varchar', nullable: true })
  expectedPublishOn?: CalendarDate | null;

  @ManyToMany(() => Tag, { cascade: true })
  @JoinTable({ name: 'content_tag', joinColumn: { name: 'contentId' }, inverseJoinColumn: { name: 'tagId' } })
  tags: Tag[];

  private constructor(args: Ctor) {
    super();

    if (args) {
      this.thumbnailImageUrl = args.thumbnailImageUrl;
      this.title = args.title;
      this.description = args.description;
      this.status = ContentStatus.PENDING;
      this.tags = [];
    }
  }

  static of(args: { thumbnailImageUrl: string; title: string; description: string; tags: Tag[] }) {
    const content = new Content(args);

    content.setTags(args.tags);

    return content;
  }

  update(args: { thumbnailImageUrl?: string; title?: string; description?: string }) {
    const changed = this.stripUnchanged(args);

    if (!changed) {
      return;
    }

    Object.assign(this, args);
  }

  setTags(desired: Tag[]) {
    const currentIds = new Set(this.tags.map((t) => t.id));
    const desiredIds = new Set(desired.map((t) => t.id));

    const added = desired.filter((t) => !currentIds.has(t.id));
    const removed = this.tags.filter((t) => !desiredIds.has(t.id));

    this.tags = desired;

    this.publishEvent(
      new ContentSetTagEvent({ addedTagIds: added.map((t) => t.id), removedTagIds: removed.map((t) => t.id) })
    );
  }

  transitionTo(nextStatus: ContentStatus) {
    if (this.status === nextStatus) {
      return;
    }

    if (!canTransitionContent(this.status, nextStatus)) {
      const message = `'${CONTENT_STATUS_LABEL[this.status]}' → '${CONTENT_STATUS_LABEL[nextStatus]}' 상태 변경은 허용되지 않습니다.`;
      throw new BadRequestException(message, { cause: message });
    }

    this.status = nextStatus;
  }
}
