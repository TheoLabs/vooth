import { DddAggregate } from '@libs/ddd';
import { Column, Entity, Index, PrimaryGeneratedColumn, Unique } from 'typeorm';

type Ctor = {
  creatorId: number;
  lineId: number;
  castingId: number;
  episodeId: number;
  take: number;
  audioFileId: number;
  durationMs: number;
};

@Entity()
@Index('idx_recording_creator_id_episode_id', ['creatorId', 'episodeId'])
@Unique('idx_line_id_casting_id_episode_id_take', ['lineId', 'castingId', 'episodeId', 'take'])
export class Recording extends DddAggregate {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  creatorId: number;

  @Column()
  lineId: number;

  @Column()
  castingId: number;

  @Column()
  episodeId: number;

  @Column()
  take: number;

  @Column()
  audioFileId: number;

  @Column()
  durationMs: number;

  @Column()
  isAdopted: boolean;

  private constructor(args: Ctor) {
    super();

    if (args) {
      this.creatorId = args.creatorId;
      this.lineId = args.lineId;
      this.castingId = args.castingId;
      this.episodeId = args.episodeId;
      this.take = args.take;
      this.audioFileId = args.audioFileId;
      this.durationMs = args.durationMs;
      this.isAdopted = false;
    }
  }

  static of(args: Ctor) {
    return new Recording(args);
  }

  select() {
    this.isAdopted = true;
  }

  unselect() {
    this.isAdopted = false;
  }
}
