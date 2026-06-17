import { DddService } from '@libs/ddd';
import { BadRequestException, Injectable } from '@nestjs/common';
import { TagRepository } from '../infrastructure/tag.repository';
import { Transactional } from '@libs/decorators';
import { Tag } from '../domain/tag.entity';
import { PaginationOptions } from '@libs/utils';
import { AdminTagResponseDto } from '../presentation/dto';
import { EventHandler } from '@libs/decorators/event-handler.decorator';

@Injectable()
export class AdminTagService extends DddService {
  constructor(private readonly tagRepository: TagRepository) {
    super();
  }

  @Transactional()
  async create({ name, color }: { name: string; color: string }) {
    const [existingTag] = await this.tagRepository.find({ name });

    if (existingTag) {
      throw new BadRequestException('이미 존재하는 태그입니다.', { cause: '이미 존재하는 태그입니다.' });
    }

    const newTag = Tag.of({ name, color });
    await this.tagRepository.save([newTag]);
  }

  async list({ searchKey, searchValue }: { searchKey?: string; searchValue?: string }, options?: PaginationOptions) {
    const [tags, total] = await Promise.all([
      this.tagRepository.find({ searchKey, searchValue }, { options }),
      this.tagRepository.count({ searchKey, searchValue }),
    ]);

    return { items: tags.map((tag) => tag.toInstance(AdminTagResponseDto)), total };
  }

  @Transactional()
  async update({ id, name, color }: { id: number; name?: string; color?: string }) {
    const [tag] = await this.tagRepository.find({ ids: [id] });

    if (!tag) {
      throw new BadRequestException('존재하지 않는 태그입니다.', { cause: '존재하지 않는 태그입니다.' });
    }

    if (name) {
      const [existingTag] = await this.tagRepository.find({ name });
      if (existingTag) {
        throw new BadRequestException('이미 존재하는 태그입니다.', { cause: '이미 존재하는 태그입니다.' });
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

  // TODO: content domain이 만들어지면 할 예정.
  // @EventHandler()
  // @Transactional()
  // async handleContentSetTagEvent() {}
}
