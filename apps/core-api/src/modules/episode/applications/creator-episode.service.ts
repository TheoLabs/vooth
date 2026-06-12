import { DddService } from '@libs/ddd';
import { Injectable } from '@nestjs/common';
import { EpisodeRepository } from '../infrastructure/episode.repository';
import { PaginationOptions } from '@libs/utils';
import { RecordableEpisodeSpec } from '../domain/specs';

@Injectable()
export class CreatorEpisodeService extends DddService {
  constructor(private readonly episodeRepository: EpisodeRepository) {
    super();
  }

  async list({ contentId }: { contentId?: number }, options?: PaginationOptions) {
    const [episodes, total] = await Promise.all([
      this.episodeRepository.satifyElementFrom(new RecordableEpisodeSpec({ contentId }), { options }),
      this.episodeRepository.satifyCountFrom(new RecordableEpisodeSpec({ contentId })),
    ]);

    return { items: episodes, total };
  }
}
