/**
 * 날짜/일시를 문자열로 표현하는 커스텀 타입.
 * - 날짜: `YYYY-MM-DD` (예: `2026-06-17`)
 * - 일시: `YYYY-MM-DD HH:mm:ss` (예: `2026-06-17 09:30:00`)
 *
 * `Date` 객체 대신 직렬화/전송에 안정적인 문자열 표현을 쓰기 위한 의미 타입.
 * 런타임 검증이 필요하면 `CALENDAR_DATE_REGEX` / `isCalendarDate` 를 사용한다.
 */
export type CalendarDate = string;

/** `YYYY-MM-DD` */
export const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

/** `YYYY-MM-DD HH:mm:ss` */
export const DATETIME_REGEX = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/;

/** `YYYY-MM-DD` 또는 `YYYY-MM-DD HH:mm:ss` (둘 다 허용). class-validator `@Matches` 등에 사용. */
export const CALENDAR_DATE_REGEX = /^\d{4}-\d{2}-\d{2}( \d{2}:\d{2}:\d{2})?$/;

/** 문자열이 CalendarDate 형식(날짜 또는 일시)인지 검사. */
export function isCalendarDate(value: unknown): value is CalendarDate {
  return typeof value === 'string' && CALENDAR_DATE_REGEX.test(value);
}
