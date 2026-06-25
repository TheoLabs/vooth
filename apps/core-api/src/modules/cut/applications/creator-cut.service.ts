import { DddService } from '@libs/ddd';
import { EpisodeRepository } from '@modules/episode/infrastructure/episode.repository';
import { Injectable, BadRequestException } from '@nestjs/common';
import { CutRepository } from '../infrastructure/cut.repository';
import { FileService } from '@modules/file/applications/file.service';
import { CharacterRepository } from '@modules/character/infrastructure/character.repository';
import { Creator } from '@modules/creator/domain/creator.entity';
import { CastingRepository } from '@modules/casting/infrastructure/casting.repository';
import { RecordingRepository } from '@modules/recording/infrastructure/recording.repository';
import { Recording } from '@modules/recording/domain/recording.entity';
import { plainToInstance } from 'class-transformer';
import { CreatorCharacterDto, CreatorCutDto } from '../presentation/dto';

@Injectable()
export class CreatorCutService extends DddService {
  constructor(
    private readonly fileService: FileService,
    private readonly episodeRepository: EpisodeRepository,
    private readonly cutRepository: CutRepository,
    private readonly characterRepository: CharacterRepository,
    private readonly castingRepository: CastingRepository,
    private readonly recordingRepository: RecordingRepository
  ) {
    super();
  }

  async list({ creator, episodeId }: { creator: Creator; episodeId: number }) {
    const [episode] = await this.episodeRepository.find({ ids: [episodeId] });

    if (!episode) {
      throw new BadRequestException('해당하는 에피소드가 없습니다.', {
        cause: '해당하는 에피소드가 없습니다.',
      });
    }

    const cuts = await this.cutRepository.find({ episodeId: episode.id }, { relations: { lines: true } });

    const characters = await this.characterRepository.find({
      ids: [...new Set(cuts.flatMap((c) => c.lines.flatMap((line) => line.characterId)))],
    });
    const myCastings = await this.castingRepository.find({
      characterIds: characters.map((character) => character.id),
      creatorId: creator.id,
    });

    if (myCastings.length === 0) {
      throw new BadRequestException('참여하지 않은 회차입니다.', { cause: '참여하지 않은 회차입니다.' });
    }
    const myCharacterIds = myCastings.map((myCasting) => myCasting.characterId);

    const getPublicUrl = await this.fileService.getPublicUrl(cuts.map((c) => c.imageFileId));

    const lineIds = cuts.flatMap((cut) => cut.lines.map((line) => line.id));
    const recordings = await this.recordingRepository.find({
      creatorId: creator.id,
      lineIds: lineIds,
    });

    const getAudioUrl = await this.fileService.getPublicUrl(recordings.map((recording) => recording.audioFileId));

    // 라인당 테이크 여러 개(최대 3) → 배열로 모은다.
    const recordingMap = new Map<number, Recording[]>();
    recordings.forEach((recording) => {
      const takes = recordingMap.get(recording.lineId) ?? [];
      takes.push(recording);
      recordingMap.set(recording.lineId, takes);
    });

    return {
      cuts: cuts.map((cut) =>
        plainToInstance(CreatorCutDto, {
          ...cut,
          imageUrl: getPublicUrl(cut.imageFileId),
          lines: cut.lines.map((line) => ({
            ...line,
            isMine: myCharacterIds.includes(line.characterId),
            recordings: (recordingMap.get(line.id) ?? [])
              .sort((a, b) => a.take - b.take)
              .map((recording) => ({ ...recording, audioUrl: getAudioUrl(recording.audioFileId) })),
          })),
        })
      ),
      characters: characters.map((character) => plainToInstance(CreatorCharacterDto, character)),
    };
  }
}
