import { DddService } from '@libs/ddd';
import { EpisodeRepository } from '@modules/episode/infrastructure/episode.repository';
import { Injectable, BadRequestException } from '@nestjs/common';
import { CutRepository } from '../infrastructure/cut.repository';
import { FileService } from '@modules/file/applications/file.service';
import { CharacterRepository } from '@modules/character/infrastructure/character.repository';
import { Creator } from '@modules/creator/domain/creator.entity';
import { CastingRepository } from '@modules/casting/infrastructure/casting.repository';

@Injectable()
export class CreatorCutService extends DddService {
  constructor(
    private readonly fileService: FileService,
    private readonly episodeRepository: EpisodeRepository,
    private readonly cutRepository: CutRepository,
    private readonly characterRepository: CharacterRepository,
    private readonly castingRepository: CastingRepository
  ) {
    super();
  }

  async list({ creator, episodeId }: { creator: Creator; episodeId: number }) {
    const [episode] = await this.episodeRepository.find({ id: episodeId });

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

    return {
      cuts: cuts.map((cut) => ({
        ...cut,
        lines: cut.lines.map((line) => ({
          ...line,
          isMine: myCharacterIds.includes(line.characterId),
        })),
        imageUrl: getPublicUrl(cut.imageFileId),
      })),
      characters,
    };
  }
}
