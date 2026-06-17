import { DddAggregate } from '@libs/ddd';
import { Tag } from '@modules/tag/domain/tag.entity';
import { CalendarDate, ContentStatus, type CropBox } from '@vooth/shared';
import { Column, Entity, JoinTable, ManyToMany, PrimaryGeneratedColumn } from 'typeorm';
import { ContentSetTagEvent } from './events';

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
}
