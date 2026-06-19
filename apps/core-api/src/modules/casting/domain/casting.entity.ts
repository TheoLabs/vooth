import { DddAggregate } from '@libs/ddd';
import { Character } from '@modules/character/domain/character.entity';
import { Creator } from '@modules/creator/domain/creator.entity';
import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

type Ctor = {
  characterId: number;
  creatorId: number;
  contentId: number;
};

@Entity()
@Index('idx_casting_character_id_creator_id', ['characterId', 'creatorId'], { unique: true })
@Index('idx_casting_content_id', ['contentId'])
export class Casting extends DddAggregate {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  characterId: number;

  @Column()
  creatorId: number;

  @Column()
  contentId: number;

  @Column()
  isPublished: boolean;

  @ManyToOne(() => Character, { createForeignKeyConstraints: false })
  @JoinColumn({ name: 'characterId' })
  character: Character;

  @ManyToOne(() => Creator, { createForeignKeyConstraints: false })
  @JoinColumn({ name: 'creatorId' })
  creator: Creator;

  private constructor(args: Ctor) {
    super();

    if (args) {
      this.characterId = args.characterId;
      this.creatorId = args.creatorId;
      this.contentId = args.contentId;
      this.isPublished = false;
    }
  }

  static of(args: Ctor) {
    return new Casting(args);
  }

  changePublish(isPublished: boolean) {
    this.isPublished = isPublished;
  }
}
