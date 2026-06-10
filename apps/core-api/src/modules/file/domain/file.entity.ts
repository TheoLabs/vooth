import { DddAggregate } from '@libs/ddd';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

type Ctor = {
  mimeType: string;
  originalName: string;
  size: number;
  key: string;
};

@Entity()
export class File extends DddAggregate {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  mimeType: string;

  @Column()
  originalName: string;

  @Column()
  size: number;

  @Column()
  key: string;

  @Column()
  isCommit: boolean;

  private constructor(args: Ctor) {
    super();

    if (args) {
      this.mimeType = args.mimeType;
      this.originalName = args.originalName;
      this.size = args.size;
      this.key = args.key;
      this.isCommit = false;
    }
  }

  static of(args: Ctor) {
    return new File(args);
  }

  commit() {
    this.isCommit = true;
  }
}
