import { DddService } from '@libs/ddd';
import { BadRequestException, Injectable } from '@nestjs/common';
import { RecordingRepository } from '../infrastructure/recording.repository';
import { Transactional } from '@libs/decorators';
import { Creator } from '@modules/creator/domain/creator.entity';
import { RecordingPhase, Recording } from '../domain/recording.entity';
import { EpisodeRepository } from '@modules/episode/infrastructure/episode.repository';
import { PaginationOptions } from '@libs/utils';

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
    take,
    phase,
  }: {
    creator: Creator;
    lineId: number;
    episodeId: number;
    audioUrl: string;
    durationMs: number;
    take: number;
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

    const [existingRecording] = await this.recordingRepository.find({ creatorId: creator.id, lineId, take });

    if (existingRecording) {
      throw new BadRequestException('해당 테이크에 이미 녹음 기록이 존재합니다', {
        cause: '해당 테이크에 이미 녹음 기록이 존재합니다',
      });
    }

    const recording = Recording.of({
      creatorId: creator.id,
      lineId,
      episodeId,
      audioUrl,
      durationMs,
      take,
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
