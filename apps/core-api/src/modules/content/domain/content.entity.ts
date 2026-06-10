import { DddAggregate } from '@libs/ddd';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { ContentStatus } from '@vooth/shared';

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

  private constructor(args: Ctor) {
    super();

    if (args) {
      this.thumbnailImageUrl = args.thumbnailImageUrl;
      this.title = args.title;
      this.description = args.description;
      this.status = ContentStatus.PENDING;
    }
  }

  static of(args: Ctor) {
    return new Content(args);
  }
}
