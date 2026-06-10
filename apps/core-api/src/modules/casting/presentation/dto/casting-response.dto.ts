import { ResponseDto } from '@libs/utils';
import { CharacterType } from '@vooth/shared';
import { Exclude, Expose, Type } from 'class-transformer';

@Exclude()
class AccountDto extends ResponseDto {
  @Expose()
  id: number;

  @Expose()
  name: string;
}

@Exclude()
class CharacterDto extends ResponseDto {
  @Expose()
  id: number;

  @Expose()
  name: string;

  @Expose()
  type: CharacterType;

  @Expose()
  color: string;
}

@Exclude()
class CreatorDto extends ResponseDto {
  @Expose()
  id: number;

  @Expose()
  accountId: number;

  @Expose()
  @Type(() => AccountDto)
  account: AccountDto;
}

@Exclude()
export class CastingResponseDto extends ResponseDto {
  @Expose()
  id: number;

  @Expose()
  characterId: number;

  @Expose()
  creatorId: number;

  @Expose()
  contentId: number;

  @Expose()
  @Type(() => CharacterDto)
  character: CharacterDto;

  @Expose()
  @Type(() => CreatorDto)
  creator: CreatorDto;
}
