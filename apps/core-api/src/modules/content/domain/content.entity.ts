import { DddAggregate } from '@libs/ddd';
import { Column, Entity, JoinTable, ManyToMany, PrimaryGeneratedColumn } from 'typeorm';
import { ContentStatus } from '@vooth/shared';
import { Tag } from '@modules/tag/domain/tag.entity';
import { ContentSetTagEvent } from './events';

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
}
