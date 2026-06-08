export interface Permission {
  id: number;
  roleId: number;
  action: string;
  description: string;
}

export const permissionsMock: Permission[] = [
  // SUPER_ADMIN (roleId 1) — 전체 권한
  { id: 1, roleId: 1, action: 'account:read', description: '계정 조회' },
  { id: 2, roleId: 1, action: 'account:write', description: '계정 생성/수정' },
  { id: 3, roleId: 1, action: 'role:read', description: '역할 조회' },
  { id: 4, roleId: 1, action: 'role:write', description: '역할 생성/수정' },
  { id: 5, roleId: 1, action: 'permission:write', description: '권한 부여/회수' },
  // SETTLEMENT_ADMIN (roleId 2)
  { id: 6, roleId: 2, action: 'account:read', description: '계정 조회' },
  { id: 7, roleId: 2, action: 'role:read', description: '역할 조회' },
  // REVIEWER (roleId 3)
  { id: 8, roleId: 3, action: 'account:read', description: '계정 조회' },
  { id: 9, roleId: 3, action: 'role:read', description: '역할 조회' },
  // VOICE_ACTOR (roleId 4)
  { id: 10, roleId: 4, action: 'account:read', description: '본인 계정 조회' },
];

export function countPermissionsByRole(roleId: number): number {
  return permissionsMock.filter((p) => p.roleId === roleId).length;
}

/** 역할에 부여할 수 있는 권한 정의 (등록 폼에서 선택지로 사용) */
export interface PermissionDef {
  action: string;
  description: string;
  /** 권한을 묶어서 보여주기 위한 리소스 그룹 */
  group: string;
}

/**
 * 할당 가능한 전체 권한 카탈로그. 역할 등록 시 선택지로 노출한다.
 * 실제로는 GET /admins/permissions 로 조회할 예정이며, 권한 수가 많아질 수 있어
 * 등록 폼에서는 검색 + 그룹 트리로 선택한다.
 */
export const permissionCatalog: PermissionDef[] = [
  // 계정
  { action: 'account:read', description: '계정 조회', group: '계정' },
  { action: 'account:write', description: '계정 생성/수정', group: '계정' },
  { action: 'account:delete', description: '계정 삭제', group: '계정' },
  { action: 'account:approve', description: '계정 승인', group: '계정' },
  { action: 'account:export', description: '계정 내보내기', group: '계정' },
  // 역할
  { action: 'role:read', description: '역할 조회', group: '역할' },
  { action: 'role:write', description: '역할 생성/수정', group: '역할' },
  { action: 'role:delete', description: '역할 삭제', group: '역할' },
  { action: 'role:assign', description: '역할 배정', group: '역할' },
  // 권한
  { action: 'permission:read', description: '권한 조회', group: '권한' },
  { action: 'permission:write', description: '권한 부여/회수', group: '권한' },
  // 콘텐츠
  { action: 'content:read', description: '콘텐츠 조회', group: '콘텐츠' },
  { action: 'content:write', description: '콘텐츠 등록/수정', group: '콘텐츠' },
  { action: 'content:delete', description: '콘텐츠 삭제', group: '콘텐츠' },
  { action: 'content:publish', description: '콘텐츠 게시', group: '콘텐츠' },
  { action: 'content:review', description: '콘텐츠 검수', group: '콘텐츠' },
  // 정산
  { action: 'settlement:read', description: '정산 조회', group: '정산' },
  { action: 'settlement:write', description: '정산 생성/수정', group: '정산' },
  { action: 'settlement:approve', description: '정산 승인', group: '정산' },
  { action: 'settlement:export', description: '정산 내보내기', group: '정산' },
  // 통계
  { action: 'stats:read', description: '통계 조회', group: '통계' },
  { action: 'stats:export', description: '통계 내보내기', group: '통계' },
  // 알림
  { action: 'notification:read', description: '알림 조회', group: '알림' },
  { action: 'notification:write', description: '알림 발송', group: '알림' },
  // 시스템
  { action: 'system:read', description: '시스템 설정 조회', group: '시스템' },
  { action: 'system:write', description: '시스템 설정 변경', group: '시스템' },
  { action: 'system:audit', description: '감사 로그 조회', group: '시스템' },
];

/** action → 설명 매핑 (태그 라벨 등에 사용) */
export const permissionDescriptionByAction: Record<string, string> =
  Object.fromEntries(permissionCatalog.map((p) => [p.action, p.description]));
