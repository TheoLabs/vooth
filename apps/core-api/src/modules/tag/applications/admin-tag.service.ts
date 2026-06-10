import { DddService } from '@libs/ddd';
import { BadRequestException, Injectable } from '@nestjs/common';
import { TagRepository } from '../infrastructure/tag.repository';
import { Transactional } from '@libs/decorators';
import { TagColor } from '@vooth/shared';
import { Tag } from '../domain/tag.entity';
import { PaginationOptions } from '@libs/utils';
import { TagResponseDto } from '../presentation/dto';
import { EventHandler } from '@libs/decorators/event-handler.decorator';
import { ContentSetTagEvent } from '@modules/content/domain/events';

@Injectable()
export class AdminTagService extends DddService {
  constructor(private readonly tagRepository: TagRepository) {
    super();
  }

  @Transactional()
  async create({ name, color }: { name: string; color: TagColor }) {
    const [exisitingTag] = await this.tagRepository.find({ name });

    if (exisitingTag) {
      throw new BadRequestException('이미 등록된 태그입니다.', { cause: '이미 등록된 태그입니다.' });
    }

    const tag = Tag.of({ name, color });

    await this.tagRepository.save([tag]);
  }

  async list({ searchKey, searchValue }: { searchKey?: string; searchValue?: string }, options?: PaginationOptions) {
    const [tags, total] = await Promise.all([
      this.tagRepository.find({ searchKey, searchValue }, { options }),
      this.tagRepository.count({ searchKey, searchValue }),
    ]);

    return { items: tags.map((t) => t.toInstance(TagResponseDto)), total };
  }

  @Transactional()
  async update({ id, name, color }: { id: number; name?: string; color?: TagColor }) {
    const [tag] = await this.tagRepository.find({ ids: [id] });

    if (!tag) {
      throw new BadRequestException('존재하지 않는 태그입니다.', { cause: '존재하지 않는 태그입니다.' });
    }

    if (name) {
      const [exisitingTag] = await this.tagRepository.find({ name });
      if (exisitingTag) {
        throw new BadRequestException('이미 등록된 태그입니다.', { cause: '이미 등록된 태그입니다.' });
      }
    }

    tag.update({ name, color });
    await this.tagRepository.save([tag]);
  }

  @Transactional()
  async remove({ id }: { id: number }) {
    const [tag] = await this.tagRepository.find({ ids: [id] });

    if (!tag) {
      throw new BadRequestException('존재하지 않는 태그입니다.', { cause: '존재하지 않는 태그입니다.' });
    }

    await this.tagRepository.remove([tag]);
  }

  @EventHandler(ContentSetTagEvent, {
    description: '컨텐츠-태그 변경 시 영향받은 태그의 사용량을 content_tag 기준으로 재계산한다.',
  })
  @Transactional()
  async onContentSetTag({ addedTagIds, removedTagIds }: ContentSetTagEvent) {
    const affectedIds = [...new Set([...addedTagIds, ...removedTagIds])];

    if (affectedIds.length > 0) {
      const tags = await this.tagRepository.find({ ids: affectedIds });

      await Promise.all(
        tags.map(async (tag) => {
          const usageCount = await this.tagRepository.countTagUsage(tag.id);
          tag.setUsageCount(usageCount);
        })
      );

      await this.tagRepository.save(tags);
    }
  }
}
