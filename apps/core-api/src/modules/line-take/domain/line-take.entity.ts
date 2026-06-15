import { DddAggregate } from '@libs/ddd';
import { Column, Entity, Index, PrimaryGeneratedColumn, Unique } from 'typeorm';

type Ctor = {
  lineId: number;
  episodeId: number;
  creatorId: number;
  recordingId: number;
};

/**
 * 채택(LineTake) — (라인 × 성우)당 최종 take 1개.
 * 멀티캐스팅: 같은 라인에 성우마다 각자 최종 take 를 가진다. 성우 본인이 채택한다.
 */
@Entity()
@Index('idx_line_take_episode_id_creator_id', ['episodeId', 'creatorId'])
@Unique('idx_line_take_line_id_creator_id', ['lineId', 'creatorId'])
export class LineTake extends DddAggregate {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  lineId: number;

  @Column()
  episodeId: number;

  @Column()
  creatorId: number;

  @Column()
  recordingId: number;

  private constructor(args: Ctor) {
    super();

    if (args) {
      this.lineId = args.lineId;
      this.episodeId = args.episodeId;
      this.creatorId = args.creatorId;
      this.recordingId = args.recordingId;
    }
  }

  static of(args: Ctor) {
    return new LineTake(args);
  }

  update(args: { recordingId?: number }) {
    const changed = this.stripUnchanged(args);

    if (!changed) {
      return;
    }

    Object.assign(this, changed);
  }
}
