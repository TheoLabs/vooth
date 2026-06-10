import { DddService } from '@libs/ddd';
import { BadRequestException, Injectable } from '@nestjs/common';
import { ContentRepository } from '../infrastructure/content.repository';
import { Transactional } from '@libs/decorators';
import { ContentStatus } from '@vooth/shared';
import { PaginationOptions } from '@libs/utils';
import { TagRepository } from '@modules/tag/infrastructure/tag.repository';
import { Content } from '../domain/content.entity';

@Injectable()
export class AdminContentService extends DddService {
  constructor(
    private readonly contentRepository: ContentRepository,
    private readonly tagRepository: TagRepository
  ) {
    super();
  }

  @Transactional()
  async create({
    thumbnailImageUrl,
    title,
    description,
    tagIds,
  }: {
    thumbnailImageUrl: string;
    title: string;
    description: string;
    tagIds: number[];
  }) {
    const [exisitingContent] = await this.contentRepository.find({ title });

    if (exisitingContent) {
      throw new BadRequestException('이미 등록된 콘텐츠입니다.', { cause: '이미 등록된 콘텐츠입니다.' });
    }

    const tags = await this.tagRepository.find({ ids: tagIds });

    if (tags.length !== tagIds.length) {
      throw new BadRequestException('존재하지 않는 태그가 있습니다.', { cause: '존재하지 않는 태그가 있습니다.' });
    }

    const content = Content.of({ thumbnailImageUrl, title, description, tags });

    await this.contentRepository.save([content]);
  }

  async list(
    {
      searchKey,
      searchValue,
      statuses,
      tagIds,
    }: {
      searchKey?: string;
      searchValue?: string;
      statuses?: ContentStatus[];
      tagIds?: number[];
    },
    options?: PaginationOptions
  ) {
    const [contents, total] = await Promise.all([
      this.contentRepository.find({ searchKey, searchValue, statuses, tagIds }, { options, relations: { tags: true } }),
      this.contentRepository.count({ searchKey, searchValue, statuses, tagIds }),
    ]);

    return { items: contents, total };
  }

  async retrieve() {}
}
