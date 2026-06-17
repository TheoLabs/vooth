import { IsOptional, IsString } from 'class-validator';

export class AdminTagUpdateDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  color?: string;
}
