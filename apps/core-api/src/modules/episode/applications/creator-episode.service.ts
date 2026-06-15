import keyBy from 'lodash/keyBy';
import { DddService } from '@libs/ddd';
import { BadRequestException, Injectable } from '@nestjs/common';
import { EpisodeRepository } from '../infrastructure/episode.repository';
import { PaginationOptions } from '@libs/utils';
import { RecordableEpisodeSpec } from '../domain/specs';
import { CharacterRepository } from '@modules/character/infrastructure/character.repository';
import { Transactional } from '@libs/decorators';
import { EventHandler } from '@libs/decorators/event-handler.decorator';
import { RecordingCreatedEvent } from '@modules/recording/domain/events';
import { EpisodeStatus } from '@vooth/shared';

@Injectable()
export class CreatorEpisodeService extends DddService {
  constructor(
    private readonly episodeRepository: EpisodeRepository,
    private readonly characterRepository: CharacterRepository
  ) {
    super();
  }

  async list({ contentId }: { contentId?: number }, options?: PaginationOptions) {
    const [episodes, total] = await Promise.all([
      this.episodeRepository.satifyElementFrom(new RecordableEpisodeSpec({ contentId }), { options }),
      this.episodeRepository.satifyCountFrom(new RecordableEpisodeSpec({ contentId })),
    ]);

    return { items: episodes, total };
  }

  async retrieve({ episodeId }: { episodeId: number }) {
    const [episode] = await this.episodeRepository.satifyElementFrom(new RecordableEpisodeSpec({ id: episodeId }), {
      relations: { cuts: { lines: true } },
    });

    if (!episode) {
      throw new BadRequestException('녹음이 불가능한 회차입니다.', { cause: '녹음이 불가능한 회차입니다.' });
    }

    const characterIds = episode.cuts.flatMap((cut) => cut.lines.map((line) => line.characterId));

    const characters = await this.characterRepository.find({ ids: characterIds });
    const characterById = keyBy(characters, 'id');

    return {
      ...episode,
      cuts: episode.cuts.map((cut) => ({
        ...cut,
        lines: cut.lines.map((line) => {
          const character = characterById[line.characterId];
          return {
            ...line,
            character: character
              ? { id: character.id, name: character.name, color: character.color, type: character.type }
              : null,
          };
        }),
      })),
    };
  }

  @EventHandler(RecordingCreatedEvent, {
    description: '녹음이 생성되면 그에 따라 에피소드를 녹음 대기 -> 녹음 중으로 변경시켜준다.',
  })
  @Transactional()
  async handleRecordingCreatedEvent(event: RecordingCreatedEvent) {
    const { episodeId } = event;

    const [episode] = await this.episodeRepository.find({ id: episodeId });

    if (episode && episode.status === EpisodeStatus.READY) {
      episode.transitionTo(EpisodeStatus.RECORDING);
      await this.episodeRepository.save([episode]);
    }
  }
}
