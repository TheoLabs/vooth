export enum RoleType {
  /** 전체 권한 (role/permission/system 등 메타 영역 포함) */
  SUPER = "SUPER",
  /** 계정 도메인 관리자 */
  ACCOUNT_MANAGER = "ACCOUNT_MANAGER",
  /** 콘텐츠 도메인 관리자 (검수 포함) */
  CONTENT_MANAGER = "CONTENT_MANAGER",
  /** 정산 도메인 관리자 */
  SETTLEMENT_MANAGER = "SETTLEMENT_MANAGER",
  /** 통계 도메인 관리자 */
  STATS_MANAGER = "STATS_MANAGER",
  /** 알림 도메인 관리자 */
  NOTIFICATION_MANAGER = "NOTIFICATION_MANAGER",
  /** 성우/크리에이터 */
  CREATOR = "CREATOR",
}
