import { DddService } from '@libs/ddd';
import { BadRequestException, Injectable } from '@nestjs/common';
import { CreatorRepository } from '../infrastructure/creator.repository';
import { Transactional } from '@libs/decorators';
import { Creator } from '../domain/creator.entity';
import { FileService } from '@modules/file/applications/file.service';
import { plainToInstance } from 'class-transformer';
import { CreatorCreatorResponseDto } from '../presentation/dto';

@Injectable()
export class CreatorCreatorService extends DddService {
  constructor(
    private readonly creatorRepository: CreatorRepository,
    private readonly fileService: FileService
  ) {
    super();
  }

  async retrieve({ id }: { id: number }) {
    const [creator] = await this.creatorRepository.find({ id });

    if (!creator) {
      throw new BadRequestException('존재하지 않는 크리에이터입니다.');
    }

    const avatarUrl = await this.fileService.resolvePublicUrl(creator.avatarFileId);

    return plainToInstance(CreatorCreatorResponseDto, { ...creator, avatarUrl });
  }

  @Transactional()
  async update({
    creator,
    nickname,
    avatarFileId,
    bio,
  }: {
    creator: Creator;
    nickname?: string;
    avatarFileId?: number | null;
    bio?: string | null;
  }) {
    creator.update({ nickname, avatarFileId, bio });

    if (avatarFileId) {
      await this.fileService.commit(avatarFileId, { mimePrefix: 'image/' });
    }
    await this.creatorRepository.save([creator]);
  }
}
