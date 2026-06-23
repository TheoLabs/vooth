import { DddService } from '@libs/ddd';
import { BadRequestException, Injectable } from '@nestjs/common';
import { ContentRepository } from '../infrastructure/content.repository';
import { PaginationDto } from '@libs/utils';
import { ContentStatus } from '@vooth/shared';
import { FileService } from '@modules/file/applications/file.service';
import { DirectorContentResponseDto } from '../presentation/dto';

@Injectable()
export class DirectorContentService extends DddService {
  constructor(
    private readonly fileService: FileService,
    private readonly contentRepository: ContentRepository
  ) {
    super();
  }

  async list(
    { searchKey, searchValue, statuses }: { searchKey?: string; searchValue?: string; statuses?: ContentStatus[] },
    options: PaginationDto
  ) {
    const [contents, total] = await Promise.all([
      this.contentRepository.find({ searchKey, searchValue, statuses }, { options }),
      this.contentRepository.count({ searchKey, searchValue, statuses }),
    ]);

    const getPublicUrl = await this.fileService.getPublicUrl(contents.map((c) => c.thumbnailFileId));

    return {
      items: contents.map((content) =>
        content.toInstance(DirectorContentResponseDto, { thumbnailUrl: getPublicUrl(content.thumbnailFileId) })
      ),
      total,
    };
  }

  async retrieve({ id }: { id: number }) {
    const [content] = await this.contentRepository.find({ id });

    if (!content) {
      throw new BadRequestException('등록되지 않은 콘텐츠입니다.', { cause: '등록되지 않은 콘텐츠입니다.' });
    }

    const thumbnailUrl = await this.fileService.resolvePublicUrl(content.thumbnailFileId);

    return content.toInstance(DirectorContentResponseDto, { thumbnailUrl });
  }
}
