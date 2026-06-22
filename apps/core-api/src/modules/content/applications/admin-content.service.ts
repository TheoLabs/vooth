import { DddService } from '@libs/ddd';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ContentRepository } from '../infrastructure/content.repository';
import { Transactional } from '@libs/decorators';
import { ContentStatus, CropBox } from '@vooth/shared';
import { PaginationOptions } from '@libs/utils';
import { FileService } from '@modules/file/applications/file.service';
import { Content } from '../domain/content.entity';
import { TagRepository } from '@modules/tag/infrastructure/tag.repository';
import { plainToInstance } from 'class-transformer';
import { AdminContentResponseDto } from '../presentation/dto';
import { EventHandler } from '@libs/decorators/event-handler.decorator';
import { EpisodeCreatedEvent, EpisodeRemovedEvent } from '@modules/episode/domain/events';
import { EpisodeRepository } from '@modules/episode/infrastructure/episode.repository';

@Injectable()
export class AdminContentService extends DddService {
  constructor(
    private readonly fileService: FileService,
    private readonly contentRepository: ContentRepository,
    private readonly tagRepository: TagRepository,
    private readonly episodeRepository: EpisodeRepository
  ) {
    super();
  }

  @Transactional()
  async create({
    thumbnailFileId,
    thumbnailCropBox,
    title,
    description,
    tagIds,
  }: {
    thumbnailFileId: number;
    thumbnailCropBox: CropBox;
    title: string;
    description: string;
    tagIds: number[];
  }) {
    const [existingContent] = await this.contentRepository.find({ title });

    if (existingContent) {
      throw new BadRequestException('이미 등록된 컨텐츠입니다.', { cause: '이미 등록된 컨텐츠입니다.' });
    }

    const tags = await this.tagRepository.find({ ids: tagIds });

    if (tags.length !== tagIds.length) {
      throw new BadRequestException('존재하지 않는 태그가 포함되어 있습니다.', {
        cause: '존재하지 않는 태그가 포함되어 있습니다.',
      });
    }

    const content = Content.of({
      thumbnailFileId,
      thumbnailCropBox,
      title,
      description,
      tags,
    });

    await this.fileService.commit(thumbnailFileId, { mimePrefix: 'image/' });
    await this.contentRepository.save([content]);
  }

  async list(
    {
      statuses,
      searchKey,
      searchValue,
      tagIds,
    }: {
      statuses?: ContentStatus[];
      searchKey?: string;
      searchValue?: string;
      tagIds?: number[];
    },
    options?: PaginationOptions
  ) {
    const [contents, total] = await Promise.all([
      this.contentRepository.find({ statuses, searchKey, searchValue, tagIds }, { options, relations: { tags: true } }),
      this.contentRepository.count({ statuses, searchKey, searchValue, tagIds }),
    ]);

    const getPublicUrl = await this.fileService.getPublicUrl(contents.map((c) => c.thumbnailFileId));

    return {
      items: contents.map((content) =>
        plainToInstance(AdminContentResponseDto, {
          ...content,
          thumbnailUrl: getPublicUrl(content.thumbnailFileId),
        })
      ),
      total,
    };
  }

  async retrieve({ id }: { id: number }) {
    const [content] = await this.contentRepository.find({ id }, { relations: { tags: true } });

    if (!content) {
      throw new NotFoundException('존재하지 않는 컨텐츠입니다.');
    }

    const thumbnailUrl = await this.fileService.resolvePublicUrl(content.thumbnailFileId);

    return plainToInstance(AdminContentResponseDto, {
      ...content,
      thumbnailUrl,
    });
  }

  @Transactional()
  async update({
    id,
    title,
    description,
    thumbnailFileId,
    thumbnailCropBox,
    tagIds,
  }: {
    id: number;
    title?: string;
    description?: string;
    thumbnailFileId?: number;
    thumbnailCropBox?: CropBox;
    tagIds?: number[];
  }) {
    const [content] = await this.contentRepository.find({ id }, { relations: { tags: true } });

    if (!content) {
      throw new BadRequestException('존재하지 않는 컨텐츠입니다.');
    }

    if (title) {
      const [existingContent] = await this.contentRepository.find({ title });

      if (existingContent) {
        throw new BadRequestException('이미 등록된 컨텐츠입니다.', { cause: '이미 등록된 컨텐츠입니다.' });
      }
    }

    if (tagIds) {
      const tags = await this.tagRepository.find({ ids: tagIds });

      if (tags.length !== tagIds.length) {
        throw new BadRequestException('존재하지 않는 태그가 포함되어 있습니다.', {
          cause: '존재하지 않는 태그가 포함되어 있습니다.',
        });
      }

      content.setTags(tags);
    }

    if (thumbnailFileId) {
      await this.fileService.commit(thumbnailFileId, { mimePrefix: 'image/' });
    }

    content.update({
      title,
      description,
      thumbnailFileId,
      thumbnailCropBox,
    });

    await this.contentRepository.save([content]);
  }

  @Transactional()
  async remove({ id }: { id: number }) {
    const [content] = await this.contentRepository.find({ id }, { relations: { tags: true } });

    if (!content) {
      throw new BadRequestException('존재하지 않는 컨텐츠입니다.');
    }

    content.remove();

    await this.contentRepository.save([content]);
  }

  @Transactional()
  async transitionStatus({ id, nextStatus }: { id: number; nextStatus: ContentStatus }) {
    const [content] = await this.contentRepository.find({ id });

    if (!content) {
      throw new BadRequestException('존재하지 않는 컨텐츠입니다.');
    }

    content.transitionManually(nextStatus);

    await this.contentRepository.save([content]);
  }

  @EventHandler(EpisodeRemovedEvent, { description: '에피소드가 삭제되면 episodeCount를 최신화한다.' })
  @EventHandler(EpisodeCreatedEvent, { description: '에피소드가 생성되면 episodeCount를 최신화한다.' })
  @Transactional()
  async handleSyncEpisodeCountEvent(event: EpisodeCreatedEvent | EpisodeRemovedEvent) {
    const { contentId } = event;

    const [content] = await this.contentRepository.find({ id: contentId });

    if (content) {
      const episodeCount = await this.episodeRepository.count({ contentId });

      content.update({ episodeCount });
      await this.contentRepository.save([content]);
    }
  }
}
