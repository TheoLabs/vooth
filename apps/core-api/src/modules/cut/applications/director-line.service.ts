import { DddService } from '@libs/ddd';
import { EpisodeRepository } from '@modules/episode/infrastructure/episode.repository';
import { BadRequestException, Injectable } from '@nestjs/common';
import { CutRepository } from '../infrastructure/cut.repository';
import { Transactional } from '@libs/decorators';
import { keyBy } from 'lodash';

@Injectable()
export class DirectorLineService extends DddService {
  constructor(
    private readonly episodeRepository: EpisodeRepository,
    private readonly cutRepository: CutRepository
  ) {
    super();
  }

  @Transactional()
  async setAnchorY({
    episodeId,
    anchorYItems,
  }: {
    episodeId: number;
    anchorYItems: { cutId: number; lineId: number; anchorY: number }[];
  }) {
    const [episode] = await this.episodeRepository.find({ id: episodeId });

    if (!episode) {
      throw new BadRequestException('존재하지 않는 에피소드입니다.', { cause: '존재하지 않는 에피소드입니다.' });
    }

    episode.validateChildEditable();

    const cuts = await this.cutRepository.find(
      { ids: anchorYItems.map((item) => item.cutId), episodeId },
      { relations: { lines: true } }
    );
    const cutsMap = keyBy(cuts, 'id');

    anchorYItems.forEach((anchorYItem) => {
      const cut = cutsMap[anchorYItem.cutId];

      if (!cut) {
        throw new BadRequestException('존재하지 않는 컷입니다.', { cause: '존재하지 않는 컷입니다.' });
      }

      cut.updateLine({
        lineId: anchorYItem.lineId,
        anchorY: anchorYItem.anchorY,
      });
    });

    await this.cutRepository.save(cuts);
  }
}
