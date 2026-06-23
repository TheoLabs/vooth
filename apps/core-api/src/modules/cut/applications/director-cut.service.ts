import { DddService } from '@libs/ddd';
import { Injectable } from '@nestjs/common';
import { CutRepository } from '../infrastructure/cut.repository';
import { PaginationOptions } from '@libs/utils';
import { FileService } from '@modules/file/applications/file.service';
import { DirectorCutListResponseDto } from '../presentation/dto';

@Injectable()
export class DirectorCutService extends DddService {
  constructor(
    private readonly fileService: FileService,
    private readonly cutRepository: CutRepository
  ) {
    super();
  }

  async list({ episodeId }: { episodeId?: number }, options?: PaginationOptions) {
    const [cuts, total] = await Promise.all([
      this.cutRepository.find({ episodeId }, { options, relations: { lines: true } }),
      this.cutRepository.count({ episodeId }),
    ]);

    const getPublicUrl = await this.fileService.getPublicUrl(cuts.map((cut) => cut.imageFileId));

    return {
      items: cuts.map((cut) => cut.toInstance(DirectorCutListResponseDto, { imageUrl: getPublicUrl(cut.imageFileId) })),
      total,
    };
  }
}
