import { DddService } from '@libs/ddd';
import { Injectable } from '@nestjs/common';
import { CharacterRepository } from '../infrastructure/character.repository';
import { PaginationOptions } from '@libs/utils';

@Injectable()
export class DirectorCharacterService extends DddService {
  constructor(private readonly characterRepository: CharacterRepository) {
    super();
  }

  async list({ contentId }: { contentId?: number }, options?: PaginationOptions) {
    const [characters, total] = await Promise.all([
      this.characterRepository.find({ contentId }, { options }),
      this.characterRepository.count({ contentId }),
    ]);

    return { items: characters, total };
  }
}
