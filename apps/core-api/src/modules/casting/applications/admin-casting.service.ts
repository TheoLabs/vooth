import { DddService } from '@libs/ddd';
import { BadRequestException, Injectable } from '@nestjs/common';
import { CastingRepository } from '../infrastructure/casting.repository';
import { Transactional } from '@libs/decorators';
import { PaginationOptions } from '@libs/utils';
import { ContentRepository } from '@modules/content/infrastructure/content.repository';
import { CharacterRepository } from '@modules/character/infrastructure/character.repository';
import { CreatorRepository } from '@modules/creator/infrastructure/creator.repository';
import { Casting } from '../domain/casting.entity';
import { FileService } from '@modules/file/applications/file.service';
import { AdminCastingResponseDto } from '../presentation/dto';

@Injectable()
export class AdminCastingService extends DddService {
  constructor(
    private readonly fileService: FileService,
    private readonly contentRepository: ContentRepository,
    private readonly characterRepository: CharacterRepository,
    private readonly creatorRepository: CreatorRepository,
    private readonly castingRepository: CastingRepository
  ) {
    super();
  }

  @Transactional()
  async create({ characterId, creatorId }: { characterId: number; creatorId: number }) {
    const [character] = await this.characterRepository.find({ id: characterId });

    if (!character) {
      throw new BadRequestException('등록되지 않은 캐릭터입니다.', { cause: '등록되지 않은 캐릭터입니다.' });
    }

    const [content] = await this.contentRepository.find({ id: character.contentId });

    if (!content) {
      throw new BadRequestException('등록되지 않은 컨텐츠입니다.', { cause: '등록되지 않은 컨텐츠입니다.' });
    }

    const [creator] = await this.creatorRepository.find({ id: creatorId });

    if (!creator) {
      throw new BadRequestException('등록되지 않은 크리에이터입니다.', { cause: '등록되지 않은 크리에이터입니다.' });
    }

    const [existingCasting] = await this.castingRepository.find({ characterId, creatorId });

    if (existingCasting) {
      throw new BadRequestException('이미 등록된 캐스팅입니다.', { cause: '이미 등록된 캐스팅입니다.' });
    }

    const casting = Casting.of({ contentId: character.contentId, characterId, creatorId });

    await this.castingRepository.save([casting]);
  }

  async list(
    { contentId, characterId, creatorId }: { characterId: number; contentId?: number; creatorId?: number },
    options?: PaginationOptions
  ) {
    const [castings, total] = await Promise.all([
      this.castingRepository.find({ contentId, characterId, creatorId }, { options, relations: { creator: true } }),
      this.castingRepository.count({ contentId, characterId, creatorId }),
    ]);

    const getPublicUrl = await this.fileService.getPublicUrl(castings.map((casting) => casting.creator.avatarFileId));

    return {
      items: castings.map((casting) =>
        casting.toInstance(AdminCastingResponseDto, {
          creator: { ...casting.creator, avatarUrl: getPublicUrl(casting.creator.avatarFileId) },
        })
      ),
      total,
    };
  }

  @Transactional()
  async changePublish({ id, characterId, isPublished }: { id: number; characterId: number; isPublished: boolean }) {
    const [casting] = await this.castingRepository.find({ id, characterId });

    if (!casting) {
      throw new BadRequestException('등록되지 않은 캐스팅입니다.', { cause: '등록되지 않은 캐스팅입니다.' });
    }

    casting.changePublish(isPublished);

    await this.castingRepository.save([casting]);
  }

  @Transactional()
  async remove({ id, characterId }: { id: number; characterId: number }) {
    const [casting] = await this.castingRepository.find({ id, characterId });

    if (!casting) {
      throw new BadRequestException('등록되지 않은 캐스팅입니다.', { cause: '등록되지 않은 캐스팅입니다.' });
    }

    // TODO: 녹음 존재 유무에 대한 검증이 추후 생겨야함.

    await this.castingRepository.remove([casting]);
  }
}
