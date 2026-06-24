import { DddService } from '@libs/ddd';
import { BadRequestException, Injectable } from '@nestjs/common';
import { CharacterRepository } from '../infrastructure/character.repository';
import { ContentRepository } from '@modules/content/infrastructure/content.repository';
import { Transactional } from '@libs/decorators';
import { CharacterType, ContentStatus } from '@vooth/shared';
import { PaginationOptions } from '@libs/utils';
import { FileService } from '@modules/file/applications/file.service';
import { CharacterResponseDto } from '../presentation/dto';
import { Character } from '../domain/character.entity';

@Injectable()
export class AdminCharacterService extends DddService {
  constructor(
    private readonly fileService: FileService,
    private readonly characterRepository: CharacterRepository,
    private readonly contentRepository: ContentRepository
  ) {
    super();
  }

  @Transactional()
  async create({
    contentId,
    name,
    description,
    avatarFileId,
    type,
  }: {
    contentId: number;
    name: string;
    description?: string;
    avatarFileId?: number;
    type: CharacterType;
  }) {
    const [content] = await this.contentRepository.find({ ids: [contentId] });

    if (!content) {
      throw new BadRequestException('등록되지 않은 콘텐츠입니다.', { cause: '등록되지 않은 콘텐츠입니다.' });
    }

    const [existingCharacter] = await this.characterRepository.find({ contentId, name });
    if (existingCharacter) {
      throw new BadRequestException('이미 존재하는 캐릭터 이름입니다.', {
        cause: '이미 존재하는 캐릭터 이름입니다.',
      });
    }

    const character = Character.of({
      contentId,
      name,
      description,
      avatarFileId,
      type,
    });

    await this.fileService.commit(avatarFileId, { mimePrefix: 'image/' });
    await this.characterRepository.save([character]);
  }

  async list(
    {
      contentId,
      types,
      searchKey,
      searchValue,
    }: { contentId: number; types?: CharacterType[]; searchKey?: string; searchValue?: string },
    options?: PaginationOptions
  ) {
    const [characters, total] = await Promise.all([
      this.characterRepository.find({ contentId, types, searchKey, searchValue }, { options }),
      this.characterRepository.count({ contentId, types, searchKey, searchValue }),
    ]);

    const getPublicUrl = await this.fileService.getPublicUrl(characters.map((c) => c.avatarFileId));

    return {
      items: characters.map((c) => c.toInstance(CharacterResponseDto, { avatarUrl: getPublicUrl(c.avatarFileId) })),
      total,
    };
  }

  async retrieve({ id, contentId }: { id: number; contentId: number }) {
    const [character] = await this.characterRepository.find({ id, contentId });

    if (!character) {
      throw new BadRequestException('등록되지 않은 캐릭터입니다.', { cause: '등록되지 않은 캐릭터입니다.' });
    }

    const avatarUrl = await this.fileService.resolvePublicUrl(character.avatarFileId);

    return character.toInstance(CharacterResponseDto, { avatarUrl });
  }

  @Transactional()
  async update({
    id,
    contentId,
    name,
    description,
    avatarFileId,
    type,
  }: {
    id: number;
    contentId: number;
    name?: string;
    description?: string | null;
    avatarFileId?: number | null;
    type?: CharacterType;
  }) {
    const [content] = await this.contentRepository.find({ ids: [contentId] });

    if (!content) {
      throw new BadRequestException('등록되지 않은 콘텐츠입니다.', { cause: '등록되지 않은 콘텐츠입니다.' });
    }

    if (content.status !== ContentStatus.DRAFT) {
      throw new BadRequestException('draft 상태의 콘텐츠에만 캐릭터를 수정할 수 있습니다.', {
        cause: 'draft 상태의 콘텐츠에만 캐릭터를 수정할 수 있습니다.',
      });
    }

    const [character] = await this.characterRepository.find({ id });

    if (!character) {
      throw new BadRequestException('등록되지 않은 캐릭터입니다.', { cause: '등록되지 않은 캐릭터입니다.' });
    }

    if (name) {
      const [existingCharacter] = await this.characterRepository.find({ contentId, name });
      if (existingCharacter) {
        throw new BadRequestException('이미 존재하는 캐릭터 이름입니다.', {
          cause: '이미 존재하는 캐릭터 이름입니다.',
        });
      }
    }

    character.update({ name, description, avatarFileId, type });

    if (avatarFileId) {
      await this.fileService.commit(avatarFileId, { mimePrefix: 'image/' });
    }

    await this.characterRepository.save([character]);
  }

  @Transactional()
  async remove({ id, contentId }: { id: number; contentId: number }) {
    const [character] = await this.characterRepository.find({ id, contentId });

    if (!character) {
      throw new BadRequestException('등록되지 않은 캐릭터입니다.', { cause: '등록되지 않은 캐릭터입니다.' });
    }

    // TODO: casting 도메인이 생성되면 casting 된 경우, 캐릭터가 삭제되지 못하게 막아야함.
  }
}
