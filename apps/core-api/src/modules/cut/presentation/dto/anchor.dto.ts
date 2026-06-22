import { Anchor, AnchorEdge, AnchorType } from '@vooth/shared';
import { IsEnum, IsInt } from 'class-validator';

/**
 * 타임라인 앵커 입력 검증 DTO. Line/SoundEffect/CutEffect 등 timed element 가 공유한다.
 * (shared `Anchor` 는 interface 라 `@ValidateNested` 불가 → 검증용 클래스로 분리)
 */
export class AnchorDto implements Anchor {
  @IsEnum(AnchorType)
  type: AnchorType;

  @IsInt()
  targetId: number;

  @IsEnum(AnchorEdge)
  edge: AnchorEdge;

  @IsInt()
  offsetMs: number;
}
