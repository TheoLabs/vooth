import { Transform } from 'class-transformer';

/**
 * 쿼리스트링 값을 배열로 정규화하는 데코레이터.
 *
 * @example
 * // ?statuses=active           → ['active']
 * // ?statuses=active&statuses=expired → ['active', 'expired']
 *
 * @IsEnum(LicenseStatus, { each: true })
 * @IsOptional()
 * @ToArray()
 * statuses?: LicenseStatus[];
 */
export function ToArray(): PropertyDecorator {
  return Transform(({ value }) => {
    if (typeof value === 'string') {
      return [value];
    }
    return value;
  });
}
