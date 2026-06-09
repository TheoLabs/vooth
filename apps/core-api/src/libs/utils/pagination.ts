import { Exclude, Expose, Type } from 'class-transformer';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export enum OrderType {
  ASC = 'ASC',
  DESC = 'DESC',
}

export interface PaginationOptions {
  page?: number;
  limit?: number;
  sort?: string;
  order?: OrderType;
}

export abstract class PaginationDto implements PaginationOptions {
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  page?: number;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  limit?: number;

  @IsString()
  @IsOptional()
  sort?: string;

  @IsString()
  @IsOptional()
  order?: OrderType;
}

@Exclude()
export abstract class ResponseDto {
  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;
}
