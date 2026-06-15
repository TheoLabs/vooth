import { DddService } from '@libs/ddd';
import { BadRequestException, Injectable } from '@nestjs/common';
import { Transactional } from '@libs/decorators';
import { Creator } from '@modules/creator/domain/creator.entity';
import { LineTakeRepository } from '../infrastructure/line-take.repository';
import { RecordingRepository } from '@modules/recording/infrastructure/recording.repository';
import { LineTake } from '../domain/line-take.entity';

/**
 * 채택(LineTake) — 성우 본인이 (라인 × 본인)당 최종 take 1개를 고른다.
 */
@Injectable()
export class CreatorLineTakeService extends DddService {
  constructor(
    private readonly lineTakeRepository: LineTakeRepository,
    private readonly recordingRepository: RecordingRepository
  ) {
    super();
  }

  @Transactional()
  async select({ creator, lineId, recordingId }: { creator: Creator; lineId: number; recordingId: number }) {
    // 채택할 녹음이 (해당 라인 × 본인) 소속인지 검증.
    const [recording] = await this.recordingRepository.find({ id: recordingId, lineId, creatorId: creator.id });

    if (!recording) {
      throw new BadRequestException('채택할 수 없는 녹음입니다.', { cause: '채택할 수 없는 녹음입니다.' });
    }

    const [existing] = await this.lineTakeRepository.find({ lineIds: [lineId], creatorId: creator.id });

    if (existing) {
      existing.update({ recordingId });
      await this.lineTakeRepository.save([existing]);
      return;
    }

    const lineTake = LineTake.of({ lineId, episodeId: recording.episodeId, creatorId: creator.id, recordingId });
    await this.lineTakeRepository.save([lineTake]);
  }

  async list({ creator, episodeId }: { creator: Creator; episodeId?: number }) {
    const items = await this.lineTakeRepository.find({ creatorId: creator.id, episodeId });

    return { items };
  }

  @Transactional()
  async clear({ creator, lineId }: { creator: Creator; lineId: number }) {
    const [lineTake] = await this.lineTakeRepository.find({ lineIds: [lineId], creatorId: creator.id });

    if (!lineTake) {
      return;
    }

    await this.lineTakeRepository.remove([lineTake]);
  }
}
