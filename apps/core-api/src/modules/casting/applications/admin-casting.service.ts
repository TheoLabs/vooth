import { DddService } from '@libs/ddd';
import { Transactional } from '@libs/decorators';
import { PaginationOptions } from '@libs/utils';
import { Casting } from '@modules/casting/domain/casting.entity';
import { CastingRepository } from '@modules/casting/infrastructure/casting.repository';
import { CastingResponseDto } from '@modules/casting/presentation/dto';
import { CharacterRepository } from '@modules/character/infrastructure/character.repository';
import { ContentRepository } from '@modules/content/infrastructure/content.repository';
import { CreatorRepository } from '@modules/creator/infrastructure/creator.repository';
import { BadRequestException, Injectable } from '@nestjs/common';

@Injectable()
export class AdminCastingService extends DddService {
  constructor(
    private readonly castingRepository: CastingRepository,
    private readonly creatorRepository: CreatorRepository,
    private readonly contentRepository: ContentRepository,
    private readonly characterRepository: CharacterRepository
  ) {
    super();
  }

  async list({ contentId }: { contentId?: number }, options?: PaginationOptions) {
    const [castings, total] = await Promise.all([
      this.castingRepository.find(
        { contentId },
        { options, relations: { character: true, creator: { account: true } } }
      ),
      this.castingRepository.count({ contentId }),
    ]);

    return { items: castings.map((c) => c.toInstance(CastingResponseDto)), total };
  }

  @Transactional()
  async create({ characterId, creatorId, contentId }: { characterId: number; creatorId: number; contentId: number }) {
    const [[character], [creator], [content]] = await Promise.all([
      this.characterRepository.find({ ids: [characterId] }),
      this.creatorRepository.find({ id: creatorId }),
      this.contentRepository.find({ id: contentId }),
    ]);

    if (!character) {
      throw new BadRequestException('존재하지 않는 캐릭터입니다.', { cause: '존재하지 않는 캐릭터입니다.' });
    }

    if (!creator) {
      throw new BadRequestException('존재하지 않는 크리에이터입니다.', { cause: '존재하지 않는 크리에이터입니다.' });
    }

    if (!content) {
      throw new BadRequestException('존재하지 않는 콘텐츠입니다.', { cause: '존재하지 않는 콘텐츠입니다.' });
    }

    const [exist] = await this.castingRepository.find({ characterId, creatorId, contentId });
    if (exist) {
      throw new BadRequestException('이미 캐스팅된 크리에이터입니다.', { cause: '이미 캐스팅된 크리에이터입니다.' });
    }

    const casting = Casting.of({
      characterId,
      creatorId,
      contentId,
    });

    return this.castingRepository.save([casting]);
  }

  @Transactional()
  async remove({ id }: { id: number }) {
    const [casting] = await this.castingRepository.find({ id });

    if (!casting) {
      throw new BadRequestException('존재하지 않는 캐스팅입니다.', {
        cause: '존재하지 않는 캐스팅입니다.',
      });
    }

    await this.castingRepository.softRemove([casting]);
  }
}
