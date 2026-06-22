import { DddService } from '@libs/ddd';
import { BadRequestException, Injectable } from '@nestjs/common';
import { CutRepository } from '../infrastructure/cut.repository';
import { Transactional } from '@libs/decorators';
import { EpisodeRepository } from '@modules/episode/infrastructure/episode.repository';
import { type CropBox } from '@vooth/shared';
import { Cut } from '../domain/cut.entity';
import { AdminCutResponseDto } from '../presentation/dto';
import { FileService } from '@modules/file/applications/file.service';
import { OrderType } from '@libs/utils';
import { EventHandler } from '@libs/decorators/event-handler.decorator';
import { EpisodeRemovedEvent } from '@modules/episode/domain/events';

@Injectable()
export class AdminCutService extends DddService {
  constructor(
    private readonly fileService: FileService,
    private readonly episodeRepository: EpisodeRepository,
    private readonly cutRepository: CutRepository
  ) {
    super();
  }

  @Transactional()
  async create({
    episodeId,
    order,
    imageFileId,
    imageWidth,
    imageHeight,
    imageCropBox,
  }: {
    episodeId: number;
    order: number;
    imageFileId: number;
    imageWidth: number;
    imageHeight: number;
    imageCropBox: CropBox;
  }) {
    const [episode] = await this.episodeRepository.find({ id: episodeId });

    if (!episode) {
      throw new BadRequestException('해당하는 에피소드가 없습니다.', {
        cause: '해당하는 에피소드가 없습니다.',
      });
    }

    episode.validateChildEditable();

    const [existingCut] = await this.cutRepository.find({ episodeId, order });
    if (existingCut) {
      throw new BadRequestException('이미 동일한 순서의 컷이 존재합니다.', {
        cause: '이미 동일한 순서의 컷이 존재합니다.',
      });
    }

    const cut = Cut.of({ episodeId, order, imageFileId, imageWidth, imageHeight, imageCropBox });

    await this.fileService.commit(imageFileId, { mimePrefix: 'image/' });
    await this.cutRepository.save([cut]);
  }

  async list({ episodeId }: { episodeId?: number }) {
    const [cuts, total] = await Promise.all([
      this.cutRepository.find(
        { episodeId },
        { options: { order: OrderType.ASC, sort: 'order' }, relations: { lines: true } }
      ),
      this.cutRepository.count({ episodeId }),
    ]);

    const getPublicUrl = await this.fileService.getPublicUrl(cuts.map((c) => c.imageFileId));

    return {
      items: cuts.map((c) => c.toInstance(AdminCutResponseDto, { imageUrl: getPublicUrl(c.imageFileId) })),
      total,
    };
  }

  @Transactional()
  async update({
    id,
    episodeId,
    order,
    imageFileId,
    imageWidth,
    imageHeight,
    imageCropBox,
  }: {
    id: number;
    episodeId: number;
    order?: number;
    imageFileId?: number;
    imageWidth?: number;
    imageHeight?: number;
    imageCropBox?: CropBox;
  }) {
    const [episode] = await this.episodeRepository.find({ id: episodeId });

    if (!episode) {
      throw new BadRequestException('해당하는 에피소드가 없습니다.', {
        cause: '해당하는 에피소드가 없습니다.',
      });
    }

    episode.validateChildEditable();

    const [cut] = await this.cutRepository.find({ id, episodeId });
    if (!cut) {
      throw new BadRequestException('해당하는 컷이 없습니다.', {
        cause: '해당하는 컷이 없습니다.',
      });
    }

    if (imageFileId) {
      await this.fileService.commit(imageFileId, { mimePrefix: 'image/' });
    }

    if (order) {
      const [existingCut] = await this.cutRepository.find({ episodeId, order });
      if (existingCut) {
        throw new BadRequestException('이미 동일한 순서의 컷이 존재합니다.', {
          cause: '이미 동일한 순서의 컷이 존재합니다.',
        });
      }
    }

    cut.update({ order, imageFileId, imageWidth, imageHeight, imageCropBox });

    await this.cutRepository.save([cut]);
  }

  @Transactional()
  async remove({ id, episodeId }: { id: number; episodeId: number }) {
    const [cut] = await this.cutRepository.find({ id, episodeId });

    if (!cut) {
      throw new BadRequestException('해당하는 컷이 없습니다.', {
        cause: '해당하는 컷이 없습니다.',
      });
    }

    const [episode] = await this.episodeRepository.find({ id: cut.episodeId });

    if (!episode) {
      throw new BadRequestException('해당하는 에피소드가 없습니다.', {
        cause: '해당하는 에피소드가 없습니다.',
      });
    }

    episode.validateChildEditable();

    await this.cutRepository.remove([cut]);
  }

  @EventHandler(EpisodeRemovedEvent, { description: '에피소드가 삭제되면 속한 cut을 전부 제거한다.' })
  @Transactional()
  async handleEpisodeRemoved(event: EpisodeRemovedEvent) {
    const { episodeId } = event;

    const cuts = await this.cutRepository.find({ episodeId });

    if (cuts.length > 0) {
      await this.cutRepository.remove(cuts);
    }
  }
}
