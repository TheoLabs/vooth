import { DddService } from '@libs/ddd';
import { Injectable } from '@nestjs/common';
import { CreatorRepository } from '../infrastructure/creator.repository';
import { Transactional } from '@libs/decorators';
import { Creator } from '../domain/creator.entity';
import { FileService } from '@modules/file/applications/file.service';

@Injectable()
export class CreatorCreatorService extends DddService {
  constructor(
    private readonly creatorRepository: CreatorRepository,
    private readonly fileService: FileService
  ) {
    super();
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
