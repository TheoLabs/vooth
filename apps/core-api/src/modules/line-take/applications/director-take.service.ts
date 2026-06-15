import { DddService } from '@libs/ddd';
import { Injectable } from '@nestjs/common';
import keyBy from 'lodash/keyBy';
import { LineTakeRepository } from '../infrastructure/line-take.repository';
import { RecordingRepository } from '@modules/recording/infrastructure/recording.repository';

/**
 * 연출·제작(검수/렌더)용 — 회차의 채택 take(라인별, 전 성우)에 오디오/길이를 묶어 반환.
 */
@Injectable()
export class DirectorTakeService extends DddService {
  constructor(
    private readonly lineTakeRepository: LineTakeRepository,
    private readonly recordingRepository: RecordingRepository
  ) {
    super();
  }

  async listByEpisode({ episodeId }: { episodeId: number }) {
    const lineTakes = await this.lineTakeRepository.find({ episodeId });
    const recordings = await this.recordingRepository.find({ episodeId });
    const recordingById = keyBy(recordings, 'id');

    const items = lineTakes.map((take) => {
      const recording = recordingById[take.recordingId];
      return {
        lineId: take.lineId,
        creatorId: take.creatorId,
        recordingId: take.recordingId,
        audioUrl: recording?.audioUrl ?? null,
        durationMs: recording?.durationMs ?? null,
      };
    });

    return { items };
  }
}
