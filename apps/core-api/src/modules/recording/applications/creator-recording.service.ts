import { DddService } from '@libs/ddd';
import { BadRequestException, Injectable } from '@nestjs/common';
import { RecordingRepository } from '../infrastructure/recording.repository';
import { Transactional } from '@libs/decorators';
import { Creator } from '@modules/creator/domain/creator.entity';
import { RecordingPhase, Recording } from '../domain/recording.entity';
import { EpisodeRepository } from '@modules/episode/infrastructure/episode.repository';
import { OrderType, PaginationOptions } from '@libs/utils';
import { LineTakeRepository } from '@modules/line-take/infrastructure/line-take.repository';

@Injectable()
export class CreatorRecordingService extends DddService {
  constructor(
    private readonly recordingRepository: RecordingRepository,
    private readonly episodeRepository: EpisodeRepository,
    private readonly lineTakeRepository: LineTakeRepository
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

  @Transactional()
  async remove({ creator, id }: { creator: Creator; id: number }) {
    const [recording] = await this.recordingRepository.find({ creatorId: creator.id, id });

    if (!recording) {
      throw new BadRequestException('등록되지 않은 녹음입니다.', { cause: '등록되지 않은 녹음입니다.' });
    }

    const [lineTake] = await this.lineTakeRepository.find({
      lineIds: [recording.lineId],
      creatorId: creator.id,
      recordingId: recording.id,
    });
    if (lineTake) {
      await this.lineTakeRepository.remove([lineTake]);
    }
    await this.recordingRepository.softRemove([recording]);
  }
}
