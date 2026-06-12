import { DddService } from '@libs/ddd';
import { BadRequestException, Injectable } from '@nestjs/common';
import { ContentRepository } from '../infrastructure/content.repository';
import { RecordableContentSpec } from '../domain/specs';
import { PaginationOptions } from '@libs/utils';

@Injectable()
export class CreatorContentService extends DddService {
  constructor(private readonly contentRepository: ContentRepository) {
    super();
  }

  async list({ searchKey, searchValue }: { searchKey?: string; searchValue?: string }, options: PaginationOptions) {
    const [contents, total] = await Promise.all([
      this.contentRepository.satifyElementFind(new RecordableContentSpec({ searchKey, searchValue }), {
        options,
        relations: { tags: true },
      }),
      this.contentRepository.satifyElementCount(new RecordableContentSpec({ searchKey, searchValue })),
    ]);

    return { items: contents, total };
  }

  async retrieve({ id }: { id: number }) {
    const [content] = await this.contentRepository.satifyElementFind(new RecordableContentSpec({ id }), {
      relations: { tags: true },
    });

    if (!content) {
      throw new BadRequestException('존재하지 않는 컨텐츠입니다.', { cause: '존재하지 않는 컨텐츠입니다.' });
    }

    return content;
  }
}
