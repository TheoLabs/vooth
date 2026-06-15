import { DddAggregate } from '@libs/ddd';
import { AfterInsert, Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';
import { RecordingStatus } from '@vooth/shared';
import { RecordingCreatedEvent } from './events';

export interface RecordingPhase {
  mimeType: string;
  fileSize: number;
  waveformUrl: string;
}

type Ctor = {
  lineId: number;
  episodeId: number;
  creatorId: number;
  audioUrl: string;
  durationMs: number;
  take: number;
  phase?: RecordingPhase;
};

@Entity()
@Index('idx_recording_line_id_creator_id', ['lineId', 'creatorId'])
@Index('idx_recording_episode_id_status', ['episodeId', 'status'])
export class Recording extends DddAggregate {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  lineId: number;

  @Column()
  episodeId: number;

  @Column()
  creatorId: number;

  @Column({ length: 500 })
  audioUrl: string;

  @Column()
  durationMs: number;

  @Column({ type: 'smallint' })
  status: RecordingStatus;

  @Column()
  take: number;

  @Column({ type: 'varchar', length: 500, nullable: true })
  rejectReason?: string | null;

  @Column({ type: 'json', nullable: true })
  phase?: RecordingPhase | null;

  @AfterInsert()
  private afterInsert() {
    this.publishEvent(new RecordingCreatedEvent({ recordingId: this.id, episodeId: this.episodeId }));
  }

  private constructor(args: Ctor) {
    super();

    if (args) {
      this.lineId = args.lineId;
      this.episodeId = args.episodeId;
      this.creatorId = args.creatorId;
      this.audioUrl = args.audioUrl;
      this.durationMs = args.durationMs;
      this.status = RecordingStatus.RECORDED;
      this.take = args.take;
      this.phase = args.phase;
    }
  }

  static of(args: Ctor) {
    return new Recording(args);
  }
}
