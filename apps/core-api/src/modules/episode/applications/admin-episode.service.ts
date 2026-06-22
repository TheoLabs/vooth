import { DddService } from '@libs/ddd';
import { Transactional } from '@libs/decorators';
import { PaginationOptions } from '@libs/utils';
import { EpisodeRepository } from '@modules/episode/infrastructure/episode.repository';
import { AdminEpisodeResponseDto } from '@modules/episode/presentation/dto';
import { FileService } from '@modules/file/applications/file.service';
import { BadRequestException, Injectable } from '@nestjs/common';
import { CalendarDate, CropBox, EpisodeStatus } from '@vooth/shared';
import { Episode } from '../domain/episode.entity';
import { ContentRepository } from '@modules/content/infrastructure/content.repository';

@Injectable()
export class AdminEpisodeService extends DddService {
  constructor(
    private readonly fileService: FileService,
    private readonly contentRepository: ContentRepository,
    private readonly episodeRepository: EpisodeRepository
  ) {
    super();
  }

  @Transactional()
  async create({
    contentId,
    thumbnailFileId,
    thumbnailCropBox,
    title,
    chapter,
  }: {
    contentId: number;
    thumbnailFileId?: number;
    thumbnailCropBox?: CropBox;
    title: string;
    chapter: number;
  }) {
    const [content] = await this.contentRepository.find({ id: contentId });

    if (!content) {
      throw new BadRequestException('등록되지 않은 콘텐츠입니다.', {
        cause: '등록되지 않은 콘텐츠입니다.',
      });
    }

    const [existingEpisode] = await this.episodeRepository.find({ contentId, chapter });

    if (existingEpisode) {
      throw new BadRequestException('이미 등록된 회차입니다.', {
        cause: '이미 등록된 회차입니다.',
      });
    }

    const episode = Episode.of({ contentId, thumbnailFileId, thumbnailCropBox, title, chapter });

    await this.fileService.commit(thumbnailFileId, { mimePrefix: 'image/' });
    await this.episodeRepository.save([episode]);
  }

  async list(
    {
      contentId,
      statuses,
      isFree,
      minExpectedPublishOn,
      maxExpectedPublishOn,
      searchKey,
      searchValue,
    }: {
      contentId?: number;
      statuses?: EpisodeStatus[];
      isFree?: boolean;
      minExpectedPublishOn?: CalendarDate;
      maxExpectedPublishOn?: CalendarDate;
      searchKey?: string;
      searchValue?: string;
    },
    options?: PaginationOptions
  ) {
    const [episodes, total] = await Promise.all([
      this.episodeRepository.find(
        { contentId, statuses, isFree, minExpectedPublishOn, maxExpectedPublishOn, searchKey, searchValue },
        { options }
      ),
      this.episodeRepository.count({
        contentId,
        statuses,
        isFree,
        minExpectedPublishOn,
        maxExpectedPublishOn,
        searchKey,
        searchValue,
      }),
    ]);

    const getPublicUrl = await this.fileService.getPublicUrl(episodes.map((e) => e.thumbnailFileId));

    return {
      items: episodes.map((episode) =>
        episode.toInstance(AdminEpisodeResponseDto, { thumbnailUrl: getPublicUrl(episode.thumbnailFileId) })
      ),
      total,
    };
  }

  async retrieve({ id, contentId }: { id: number; contentId: number }) {
    const [episode] = await this.episodeRepository.find({ id, contentId });

    if (!episode) {
      throw new BadRequestException('등록되지 않은 에피소드입니다.', {
        cause: '등록되지 않은 에피소드입니다.',
      });
    }

    const thumbnailUrl = await this.fileService.resolvePublicUrl(episode.thumbnailFileId);

    return episode.toInstance(AdminEpisodeResponseDto, { thumbnailUrl });
  }

  @Transactional()
  async update({
    id,
    contentId,
    thumbnailFileId,
    thumbnailCropBox,
    title,
    isFree,
    expectedPublishOn,
  }: {
    id: number;
    contentId: number;
    thumbnailFileId?: number | null;
    thumbnailCropBox?: CropBox | null;
    title?: string;
    isFree?: boolean;
    expectedPublishOn?: CalendarDate | null;
  }) {
    const [episode] = await this.episodeRepository.find({ id, contentId });

    if (!episode) {
      throw new BadRequestException('등록되지 않은 에피소드입니다.', {
        cause: '등록되지 않은 에피소드입니다.',
      });
    }

    if (thumbnailFileId) {
      await this.fileService.commit(thumbnailFileId, { mimePrefix: 'image/' });
    }

    episode.update({ thumbnailCropBox, thumbnailFileId, title, isFree, expectedPublishOn });

    await this.episodeRepository.save([episode]);
  }

  @Transactional()
  async remove({ id, contentId }: { id: number; contentId: number }) {
    const [episode] = await this.episodeRepository.find({ id, contentId });

    if (!episode) {
      throw new BadRequestException('등록되지 않은 에피소드입니다.', {
        cause: '등록되지 않은 에피소드입니다.',
      });
    }

    episode.remove();
    await this.episodeRepository.remove([episode]);
  }
}
