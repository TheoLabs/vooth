import { DddService } from '@libs/ddd';
import { BadRequestException, Injectable } from '@nestjs/common';
import { RecordingRepository } from '../infrastructure/recording.repository';
import { Transactional } from '@libs/decorators';
import { Creator } from '@modules/creator/domain/creator.entity';
import { RecordingPhase } from '../domain/recording.entity';
import { EpisodeRepository } from '@modules/episode/infrastructure/episode.repository';

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
    const [line] = await this.episodeRepository.findLines({ id: lineId, episodeId });

    if (!line) {
      throw new BadRequestException('등록되지 않은 대사입니다.', { cause: '등록되지 않은 대사입니다.' });
    }
  }
}
