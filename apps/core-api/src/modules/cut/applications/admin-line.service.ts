import { DddService } from '@libs/ddd';
import { BadRequestException, Injectable } from '@nestjs/common';
import { Transactional } from '@libs/decorators';
import { CutRepository } from '../infrastructure/cut.repository';
import { EpisodeRepository } from '@modules/episode/infrastructure/episode.repository';
import { CharacterRepository } from '@modules/character/infrastructure/character.repository';

@Injectable()
export class AdminLineService extends DddService {
  constructor(
    private readonly cutRepository: CutRepository,
    private readonly episodeRepository: EpisodeRepository,
    private readonly characterRepository: CharacterRepository
  ) {
    super();
  }

  @Transactional()
  async create({
    cutId,
    characterId,
    script,
    order,
  }: {
    cutId: number;
    characterId: number;
    script: string;
    order: number;
  }) {
    const [cut] = await this.cutRepository.find({ ids: [cutId] }, { relations: { lines: true } });
    if (!cut) {
      throw new BadRequestException('해당하는 컷이 없습니다.', {
        cause: '해당하는 컷이 없습니다.',
      });
    }

    const [episode] = await this.episodeRepository.find({ id: cut.episodeId });

    if (!episode) {
      throw new BadRequestException('해당하는 에피소드가 없습니다.', {
        cause: '해당하는 에피소드가 없습니다.',
      });
    }

    episode.validateChildEditable();

    const [character] = await this.characterRepository.find({ ids: [characterId] });

    if (!character) {
      throw new BadRequestException('해당하는 캐릭터가 없습니다.', {
        cause: '해당하는 캐릭터가 없습니다.',
      });
    }

    cut.addLine({ characterId, order, script });
    await this.cutRepository.save([cut]);
  }

  @Transactional()
  async update({
    cutId,
    lineId,
    characterId,
    script,
    order,
  }: {
    cutId: number;
    lineId: number;
    characterId?: number;
    script?: string;
    order?: number;
  }) {
    const [cut] = await this.cutRepository.find({ ids: [cutId] }, { relations: { lines: true } });
    if (!cut) {
      throw new BadRequestException('해당하는 컷이 없습니다.', {
        cause: '해당하는 컷이 없습니다.',
      });
    }

    const [episode] = await this.episodeRepository.find({ id: cut.episodeId });

    if (!episode) {
      throw new BadRequestException('해당하는 에피소드가 없습니다.', {
        cause: '해당하는 에피소드가 없습니다.',
      });
    }

    episode.validateChildEditable();

    if (characterId) {
      const [character] = await this.characterRepository.find({ ids: [characterId] });

      if (!character) {
        throw new BadRequestException('해당하는 캐릭터가 없습니다.', {
          cause: '해당하는 캐릭터가 없습니다.',
        });
      }
    }

    cut.updateLine({ lineId, characterId, script, order });

    await this.cutRepository.save([cut]);
  }

  @Transactional()
  async remove({ cutId, lineId }: { cutId: number; lineId: number }) {
    const [cut] = await this.cutRepository.find({ ids: [cutId] }, { relations: { lines: true } });
    if (!cut) {
      throw new BadRequestException('해당하는 컷이 없습니다.', {
        cause: '해당하는 컷이 없습니다.',
      });
    }

    const [episode] = await this.episodeRepository.find({ id: cut.episodeId });

    if (!episode) {
      throw new BadRequestException('해당하는 에피소드가 없습니다.', {
        cause: '해당하는 에피소드가 없습니다.',
      });
    }

    episode.validateChildEditable();
    cut.removeLine({ lineId });

    await this.cutRepository.save([cut]);
  }
}
