/**
 * 권한 카테고리.
 * 프론트(vooth-back-office) 권한 목 데이터의 그룹(계정/역할/권한/콘텐츠/정산/통계/알림/시스템)을
 * 기준으로 정의했다. 값은 권한 코드(action) 접두사 컨벤션(`account:read` 등)과 일치시킨다.
 */
export enum PermissionCategory {
  ACCOUNT = 'account',
  ROLE = 'role',
  PERMISSION = 'permission',
  CONTENT = 'content',
  SETTLEMENT = 'settlement',
  STATS = 'stats',
  NOTIFICATION = 'notification',
  SYSTEM = 'system',
}
