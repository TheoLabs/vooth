import { DddService } from '@libs/ddd';
import { BadRequestException, Injectable } from '@nestjs/common';
import { CharacterRepository } from '../infrastructure/character.repository';
import { PaginationOptions } from '@libs/utils';
import { Transactional } from '@libs/decorators';
import { CharacterType } from '@vooth/shared';
import { ContentRepository } from '@modules/content/infrastructure/content.repository';
import { Character } from '../domain/character.entityt';

@Injectable()
export class AdminCharacterService extends DddService {
  constructor(
    private readonly characterRepository: CharacterRepository,
    private readonly contentRepository: ContentRepository
  ) {
    super();
  }

  @Transactional()
  async create({
    contentId,
    name,
    type,
    color,
  }: {
    contentId: number;
    name: string;
    type: CharacterType;
    color: string;
  }) {
    const [content] = await this.contentRepository.find({ id: contentId });

    if (!content) {
      throw new BadRequestException('존재하지 않는 콘텐츠입니다.', { cause: '존재하지 않는 콘텐츠입니다.' });
    }

    const [exisitingCharacter] = await this.characterRepository.find({ contentId, name });

    if (exisitingCharacter) {
      throw new BadRequestException('이미 등록된 캐릭터입니다.', { cause: '이미 등록된 캐릭터입니다.' });
    }

    const character = Character.of({ contentId, name, type, color });
    await this.characterRepository.save([character]);
  }

  async list({ contentId, types }: { contentId?: number; types?: CharacterType[] }, options?: PaginationOptions) {
    const [characters, total] = await Promise.all([
      this.characterRepository.find({ contentId, types }, { options }),
      this.characterRepository.count({ contentId, types }),
    ]);

    return { items: characters, total };
  }
}
