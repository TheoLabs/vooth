import { DddService } from '@libs/ddd';
import { BadRequestException, Injectable } from '@nestjs/common';
import { RecordingRepository } from '../infrastructure/recording.repository';
import { Transactional } from '@libs/decorators';
import { Creator } from '@modules/creator/domain/creator.entity';
import { RecordingPhase, Recording } from '../domain/recording.entity';
import { EpisodeRepository } from '@modules/episode/infrastructure/episode.repository';
import { OrderType, PaginationOptions } from '@libs/utils';

@Injectable()
export class CreatorRecordingService extends DddService {
  constructor(
    private readonly recordingRepository: RecordingRepository,
    private readonly episodeRepository: EpisodeRepository
  ) {
    super();
  }

  @Transactional()
  async create({
    creator,
    lineId,
    episodeId,
    audioUrl,
    durationMs,
    phase,
  }: {
    creator: Creator;
    lineId: number;
    episodeId: number;
    audioUrl: string;
    durationMs: number;
    phase?: RecordingPhase;
  }) {
    const [episode] = await this.episodeRepository.find({
      id: episodeId,
    });

    if (!episode) {
      throw new BadRequestException('등록되지 않은 에피소드입니다.', { cause: '등록되지 않은 에피소드입니다.' });
    }

    episode.validRecordable();

    const [line] = await this.episodeRepository.findLines({ id: lineId, episodeId });

    if (!line) {
      throw new BadRequestException('등록되지 않은 대사입니다.', { cause: '등록되지 않은 대사입니다.' });
    }

    // take 는 서버가 부여한다((line × creator) 의 max take + 1) — 프론트의 race/비연속 방지.
    const [existingRecording] = await this.recordingRepository.find(
      { creatorId: creator.id, lineId },
      { order: OrderType.DESC, sort: 'take', limit: 1 }
    );

    const recording = Recording.of({
      creatorId: creator.id,
      lineId,
      episodeId,
      audioUrl,
      durationMs,
      take: existingRecording ? existingRecording.take + 1 : 1,
      phase,
    });

    await this.recordingRepository.save([recording]);
  }

  async list({ creator, episodeId }: { creator: Creator; episodeId?: number }, options?: PaginationOptions) {
    const [recordings, total] = await Promise.all([
      this.recordingRepository.find({ creatorId: creator.id, episodeId }, { options }),
      this.recordingRepository.count({ creatorId: creator.id, episodeId }),
    ]);

    return { items: recordings, total };
  }
}
