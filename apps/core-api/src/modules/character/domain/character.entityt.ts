import { DddAggregate } from '@libs/ddd';
import { Column, Entity, Index, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { CharacterType } from '@vooth/shared';

type Ctor = {
  contentId: number;
  name: string;
  type: CharacterType;
  color: string;
};

@Entity()
@Index('idx_character_content_id', ['contentId'])
@Unique('idx_character_content_id_name', ['contentId', 'name'])
export class Character extends DddAggregate {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  contentId: number;

  @Column()
  name: string;

  @Column({ type: 'enum', enum: CharacterType })
  type: CharacterType;

  @Column()
  color: string;

  private constructor(args: Ctor) {
    super();

    if (args) {
      this.contentId = args.contentId;
      this.name = args.name;
      this.type = args.type;
      this.color = args.color;
    }
  }

  static of(args: Ctor) {
    return new Character(args);
  }
}
