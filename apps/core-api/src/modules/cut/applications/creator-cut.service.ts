import { DddService } from '@libs/ddd';
import { EpisodeRepository } from '@modules/episode/infrastructure/episode.repository';
import { Injectable, BadRequestException } from '@nestjs/common';
import { CutRepository } from '../infrastructure/cut.repository';
import { FileService } from '@modules/file/applications/file.service';

@Injectable()
export class CreatorCutService extends DddService {
  constructor(
    private readonly fileService: FileService,
    private readonly episodeRepository: EpisodeRepository,
    private readonly cutRepository: CutRepository
  ) {
    super();
  }

  async list({ episodeId }: { episodeId: number }) {
    const [episode] = await this.episodeRepository.find({ id: episodeId });

    if (!episode) {
      throw new BadRequestException('해당하는 에피소드가 없습니다.', {
        cause: '해당하는 에피소드가 없습니다.',
      });
    }

    const [cuts, total] = await Promise.all([
      this.cutRepository.find({ episodeId: episode.id }, { relations: { lines: true } }),
      this.cutRepository.count({ episodeId: episode.id }),
    ]);

    const getPublicUrl = await this.fileService.getPublicUrl(cuts.map((c) => c.imageFileId));

    return { items: cuts.map((cut) => ({ ...cut, imageUrl: getPublicUrl(cut.imageFileId) })), total };
  }
}
