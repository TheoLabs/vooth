import { DddService } from '@libs/ddd';
import { BadRequestException, Injectable } from '@nestjs/common';
import { CreatorRepository } from '../infrastructure/creator.repository';
import { AdminFileService } from '@modules/file/applications/admin-file.service';
import { CreatorProfileResponseDto } from '../presentation/dto';

@Injectable()
export class CreatorService extends DddService {
  constructor(
    private readonly creatorRepository: CreatorRepository,
    private readonly fileService: AdminFileService
  ) {
    super();
  }

  /** 본인(creators/me) 프로필 조회. avatarFileId → avatarUrl 로 enrich. */
  async getMyProfile({ accountId }: { accountId: number }) {
    const [creator] = await this.creatorRepository.find({ accountId }, { relations: { account: true } });

    if (!creator) {
      throw new BadRequestException('존재하지 않는 크리에이터입니다.', { cause: '존재하지 않는 크리에이터입니다.' });
    }

    const urls = await this.fileService.resolvePublicUrls(creator.avatarFileId ? [creator.avatarFileId] : []);

    const dto = creator.toInstance(CreatorProfileResponseDto);
    dto.avatarUrl = creator.avatarFileId ? (urls.get(creator.avatarFileId) ?? null) : null;

    return dto;
  }
}
