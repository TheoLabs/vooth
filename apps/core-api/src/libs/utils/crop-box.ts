import {
  IsNumber,
  Max,
  Min,
  Validate,
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { CropBox } from '@vooth/shared';

/** 크롭 영역이 이미지 범위 안에 완전히 드는지(x+w ≤ 1, y+h ≤ 1) 검증. */
@ValidatorConstraint({ name: 'cropBoxWithinBounds', async: false })
class CropBoxWithinBoundsConstraint implements ValidatorConstraintInterface {
  validate(_value: unknown, args: ValidationArguments): boolean {
    const box = args.object as CropBox;
    return box.x + box.w <= 1 && box.y + box.h <= 1;
  }

  defaultMessage(): string {
    return 'cropBox 가 이미지 범위를 벗어납니다 (x+w ≤ 1, y+h ≤ 1).';
  }
}

export class CropBoxDto implements CropBox {
  @IsNumber() @Min(0) @Max(1) x: number;
  @IsNumber() @Min(0) @Max(1) y: number;
  @IsNumber() @Min(0) @Max(1) w: number;
  @IsNumber() @Min(0) @Max(1) @Validate(CropBoxWithinBoundsConstraint) h: number;
}
