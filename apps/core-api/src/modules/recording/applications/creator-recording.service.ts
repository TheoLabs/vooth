import { DddService } from '@libs/ddd';
import { BadRequestException, Injectable } from '@nestjs/common';
import { RecordingRepository } from '../infrastructure/recording.repository';
import { Transactional } from '@libs/decorators';
import { Creator } from '@modules/creator/domain/creator.entity';
import { FileService } from '@modules/file/applications/file.service';
import { Recording } from '../domain/recording.entity';
import { EpisodeRepository } from '@modules/episode/infrastructure/episode.repository';
import { RecordableEpisodeSpec } from '@modules/episode/domain/specs';
import { CutRepository } from '@modules/cut/infrastructure/cut.repository';
import { CastingRepository } from '@modules/casting/infrastructure/casting.repository';

@Injectable()
export class CreatorRecordingService extends DddService {
  constructor(
    private readonly fileService: FileService,
    private readonly cutRepository: CutRepository,
    private readonly castingRepository: CastingRepository,
    private readonly episodeRepository: EpisodeRepository,
    private readonly recordingRepository: RecordingRepository
  ) {
    super();
  }

  @Transactional()
  async record({
    creator,
    episodeId,
    cutId,
    lineId,
    audioFileId,
    durationMs,
  }: {
    creator: Creator;
    episodeId: number;
    cutId: number;
    lineId: number;
    audioFileId: number;
    durationMs: number;
  }) {
    // step 1. 녹음이 가능한 에피소드인지 확인
    const [episode] = await this.episodeRepository.satisfyElementFrom(new RecordableEpisodeSpec({ ids: [episodeId] }));

    if (!episode) {
      throw new BadRequestException('녹음할 수 없는 에피소드입니다.', {
        cause: '녹음할 수 없는 에피소드입니다.',
      });
    }

    // step 2. 라인 조회 + 회차 정합(line→cut→episode). episodeId 는 클라가 아니라 라인의 컷에서 검증한다.
    const [line] = await this.cutRepository.findLines({ ids: [lineId], cutId }, { relations: { cut: true } });

    if (!line) {
      throw new BadRequestException('등록되지 않은 라인입니다.', {
        cause: '등록되지 않은 라인입니다.',
      });
    }

    if (line.cut.episodeId !== episodeId) {
      throw new BadRequestException('해당 회차에 속한 대사가 아닙니다.', {
        cause: '해당 회차에 속한 대사가 아닙니다.',
      });
    }

    // step 3. 이 대사의 캐릭터를 내가 맡았는지(캐릭터 정합 + 소유)
    const [myCasting] = await this.castingRepository.find({
      characterIds: [line.characterId],
      creatorId: creator.id,
    });

    if (!myCasting) {
      throw new BadRequestException('이 대사의 캐릭터를 맡지 않았습니다.', {
        cause: '이 대사의 캐릭터를 맡지 않았습니다.',
      });
    }

    // step 4. (lineId, castingId) 테이크 ≤3 확인 + take 서버 할당(max+1)
    const myTakes = await this.recordingRepository.find({ lineIds: [lineId], castingIds: [myCasting.id] });

    if (myTakes.length >= 3) {
      throw new BadRequestException('대사당 최대 3개의 녹음만 가능합니다.', {
        cause: '대사당 최대 3개의 녹음만 가능합니다.',
      });
    }

    const take = Math.max(0, ...myTakes.map((recording) => recording.take)) + 1;

    const recording = Recording.of({
      creatorId: creator.id,
      lineId,
      castingId: myCasting.id,
      episodeId,
      take,
      audioFileId,
      durationMs,
    });

    await this.fileService.commit(audioFileId, { mimePrefix: 'audio/' });
    await this.recordingRepository.save([recording]);
  }

  @Transactional()
  async select({ creator, recordingId }: { creator: Creator; recordingId: number }) {
    const [recording] = await this.recordingRepository.find({ ids: [recordingId], creatorId: creator.id });

    if (!recording) {
      throw new BadRequestException('존재하지 않는 녹음 파일입니다.', {
        cause: '존재하지 않는 녹음 파일입니다.',
      });
    }

    const [episode] = await this.episodeRepository.satisfyElementFrom(
      new RecordableEpisodeSpec({ ids: [recording.episodeId] })
    );

    if (!episode) {
      throw new BadRequestException('녹음할 수 없는 에피소드입니다.', {
        cause: '녹음할 수 없는 에피소드입니다.',
      });
    }

    const selectedRecordings = (
      await this.recordingRepository.find({
        creatorId: creator.id,
        lineIds: [recording.lineId],
        isAdopted: true,
      })
    ).filter((selectedRecording) => selectedRecording.id !== recording.id);

    // NOTE: 혹시 모를 정합성이 위반되었을 때를 위함. 로직상으로는 0~1개여야 함.
    selectedRecordings.forEach((selectedRecording) => selectedRecording.unselect());

    recording.select();

    await this.recordingRepository.save([recording, ...selectedRecordings]);
  }

  @Transactional()
  async remove({ creator, recordingId }: { creator: Creator; recordingId: number }) {
    const [recording] = await this.recordingRepository.find({ ids: [recordingId], creatorId: creator.id });

    if (!recording) {
      throw new BadRequestException('존재하지 않는 녹음 파일입니다.', {
        cause: '존재하지 않는 녹음 파일입니다.',
      });
    }

    const [episode] = await this.episodeRepository.satisfyElementFrom(
      new RecordableEpisodeSpec({ ids: [recording.episodeId] })
    );

    if (!episode) {
      throw new BadRequestException('녹음을 삭제할 수 없는 에피소드입니다.', {
        cause: '녹음을 삭제할 수 없는 에피소드입니다.',
      });
    }

    // TODO: 삭제 이벤트 발행하는 도메인 메서드 필요함.

    await this.recordingRepository.remove([recording]);
  }
}
