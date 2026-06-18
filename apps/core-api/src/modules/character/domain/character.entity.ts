import { DddAggregate } from '@libs/ddd';
import { Content } from '@modules/content/domain/content.entity';
import { CharacterType, CHARACTER_TYPE_ORDER } from '@vooth/shared';
import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

type Ctor = {
  contentId: number;
  name: string;
  type: CharacterType;
  description?: string;
  avatarFileId?: number;
};

@Entity()
@Index('idx_character_content_id', ['contentId'])
export class Character extends DddAggregate {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  contentId: number;

  @Column()
  name: string;

  @Column({ type: 'enum', enum: CharacterType })
  type: CharacterType;

  @Column({ comment: 'type에 따른 순서이며 10 단위로 설정해서 나중에 순서 조정을 쉽게 하기 위함' })
  order: number;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'int', nullable: true })
  avatarFileId: number | null;

  @ManyToOne(() => Content, { createForeignKeyConstraints: false })
  @JoinColumn({ name: 'contentId' })
  content: Content;

  private constructor(args: Ctor) {
    super();

    if (args) {
      this.contentId = args.contentId;
      this.name = args.name;
      this.type = args.type;
      this.description = args.description ?? null;
      this.avatarFileId = args.avatarFileId ?? null;
      this.order = CHARACTER_TYPE_ORDER[args.type];
    }
  }

  static of(args: Ctor) {
    return new Character(args);
  }

  update(args: { name?: string; type?: CharacterType; description?: string | null; avatarFileId?: number | null }) {
    const changed = this.stripUnchanged(args);

    if (!changed) {
      return;
    }

    if (args.type) {
      this.order = CHARACTER_TYPE_ORDER[args.type];
    }

    Object.assign(this, changed);
  }
}
