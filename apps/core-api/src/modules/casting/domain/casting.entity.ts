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

  @ManyToOne(() => Character)
  @JoinColumn({ name: 'characterId' })
  character: Character;

  @ManyToOne(() => Creator)
  @JoinColumn({ name: 'creatorId' })
  creator: Creator;

  private constructor(args: Ctor) {
    super();

    if (args) {
      this.characterId = args.characterId;
      this.creatorId = args.creatorId;
      this.contentId = args.contentId;
    }
  }

  static of(args: Ctor) {
    return new Casting(args);
  }
}
