import { DddService } from '@libs/ddd';
import { EpisodeRepository } from '@modules/episode/infrastructure/episode.repository';
import { BadRequestException, Injectable } from '@nestjs/common';
import { CutRepository } from '../infrastructure/cut.repository';
import { Transactional } from '@libs/decorators';

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
      throw new BadRequestException('존재하지 않는 콘텐츠입니다.', { cause: '존재하지 않는 콘텐츠입니다.' });
    }

    episode.validateChildEditable();

    const cutIds = anchorYItems.map((item) => item.cutId);
    const cuts = await this.cutRepository.find({ ids: cutIds });

    cuts.forEach((cut) => {
      const anchorYItem = anchorYItems.find((item) => item.cutId === cut.id);
      if (anchorYItem) {
        cut.updateLine({
          lineId: anchorYItem.lineId,
          anchorY: anchorYItem.anchorY,
        });
      }
    });

    this.cutRepository.save(cuts);
  }
}
