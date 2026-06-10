export enum ContentStatus {
  PENDING = 'pending',
  SCHEDULED = 'scheduled',
  PUBLISHED = 'published',
  ARCHIVED = 'archived',
}

/**
 * 태그 색상 팔레트(의미 키). 표현(presentation) 관심사라 DB 테이블이 아닌 enum 으로 관리한다.
 * 백엔드는 이 값을 검증(@IsEnum)·저장만 하고, 실제 렌더링 색은 프론트가 매핑한다.
 * (AntD 토큰 등 UI 라이브러리 네이밍에 비종속)
 */
export enum TagColor {
  RED = 'RED',
  ORANGE = 'ORANGE',
  GOLD = 'GOLD',
  GREEN = 'GREEN',
  CYAN = 'CYAN',
  BLUE = 'BLUE',
  INDIGO = 'INDIGO',
  PURPLE = 'PURPLE',
  MAGENTA = 'MAGENTA',
  GRAY = 'GRAY',
}
