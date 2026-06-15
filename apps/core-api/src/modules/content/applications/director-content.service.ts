import { DddService } from '@libs/ddd';
import { BadRequestException, Injectable } from '@nestjs/common';
import { ContentRepository } from '../infrastructure/content.repository';
import { PaginationOptions } from '@libs/utils';
import { ContentStatus } from '@vooth/shared';

@Injectable()
export class DirectorContentService extends DddService {
  constructor(private readonly contentRepository: ContentRepository) {
    super();
  }

  async list({ searchKey, searchValue }: { searchKey?: string; searchValue?: string }, options?: PaginationOptions) {
    const [contents, total] = await Promise.all([
      this.contentRepository.find(
        { searchKey, searchValue, statuses: [ContentStatus.RECORDING] },
        { options, relations: { tags: true } }
      ),
      this.contentRepository.count({ searchKey, searchValue, statuses: [ContentStatus.RECORDING] }),
    ]);

    return { items: contents, total };
  }

  async retrieve({ id }: { id: number }) {
    const [content] = await this.contentRepository.find(
      { id, statuses: [ContentStatus.RECORDING] },
      { relations: { tags: true } }
    );

    if (!content) {
      throw new BadRequestException('존재하지 않는 콘텐츠입니다.', { cause: '존재하지 않는 콘텐츠입니다.' });
    }

    return content;
  }
}
