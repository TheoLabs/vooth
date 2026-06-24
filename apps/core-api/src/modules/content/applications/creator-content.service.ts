import { DddService } from '@libs/ddd';
import { BadRequestException, Injectable } from '@nestjs/common';
import { ContentRepository } from '../infrastructure/content.repository';
import { CastingRepository } from '@modules/casting/infrastructure/casting.repository';
import { Creator } from '@modules/creator/domain/creator.entity';
import { PaginationOptions } from '@libs/utils';
import { FileService } from '@modules/file/applications/file.service';
import { CreatorContentResponseDto } from '../presentation/dto';
import { ContentStatus } from '@vooth/shared';

@Injectable()
export class CreatorContentService extends DddService {
  constructor(
    private readonly fileService: FileService,
    private readonly contentRepository: ContentRepository,
    private readonly castingRepository: CastingRepository
  ) {
    super();
  }

  async list(
    { creator, searchKey, searchValue }: { creator: Creator; searchKey?: string; searchValue?: string },
    options?: PaginationOptions
  ) {
    const castings = await this.castingRepository.find({ creatorId: creator.id });

    const contentIds = [...new Set(castings.map((c) => c.contentId))];

    const [contents, total] = await Promise.all([
      this.contentRepository.find(
        {
          ids: contentIds,
          searchKey,
          searchValue,
          statuses: [
            ContentStatus.READY,
            ContentStatus.RECORDING,
            ContentStatus.REVIEWING,
            ContentStatus.SCHEDULED,
            ContentStatus.APPROVED,
            ContentStatus.PUBLISHED,
            ContentStatus.ARCHIVED,
          ],
        },
        { options, relations: { tags: true } }
      ),
      this.contentRepository.count({ ids: contentIds, searchKey, searchValue }),
    ]);

    const getPublicUrl = await this.fileService.getPublicUrl(contents.map((c) => c.thumbnailFileId));

    return {
      items: contents.map((content) =>
        content.toInstance(CreatorContentResponseDto, { thumbnailUrl: getPublicUrl(content.thumbnailFileId) })
      ),
      total,
    };
  }

  async retrieve({ creator, contentId }: { creator: Creator; contentId: number }) {
    const [casting] = await this.castingRepository.find({ creatorId: creator.id, contentId });

    if (!casting) {
      throw new BadRequestException('작품에 캐스팅 되어 있지 않습니다.', {
        cause: '작품에 캐스팅 되어 있지 않습니다.',
      });
    }

    const [content] = await this.contentRepository.find(
      {
        ids: [contentId],
        statuses: [
          ContentStatus.READY,
          ContentStatus.RECORDING,
          ContentStatus.REVIEWING,
          ContentStatus.SCHEDULED,
          ContentStatus.APPROVED,
          ContentStatus.PUBLISHED,
          ContentStatus.ARCHIVED,
        ],
      },
      { relations: { tags: true } }
    );

    if (!content) {
      throw new BadRequestException('존재하지 않는 작품입니다.', {
        cause: '존재하지 않는 작품입니다.',
      });
    }

    const thumbnailUrl = await this.fileService.resolvePublicUrl(content.thumbnailFileId);

    return content.toInstance(CreatorContentResponseDto, { thumbnailUrl });
  }
}
