import { PermissionCategory } from '@vooth/shared';

/** 권한 (백엔드 Permission 엔티티와 1:1: code/name/category/description) */
export interface Permission {
  code: string;
  name: string;
  category: PermissionCategory;
  description: string;
}

/** PermissionCategory 표시 메타 (라벨/태그 색상) */
export const PERMISSION_CATEGORY_META: Record<
  PermissionCategory,
  { label: string; color: string }
> = {
  [PermissionCategory.ACCOUNT]: { label: '계정', color: 'blue' },
  [PermissionCategory.ROLE]: { label: '역할', color: 'geekblue' },
  [PermissionCategory.PERMISSION]: { label: '권한', color: 'purple' },
  [PermissionCategory.CONTENT]: { label: '콘텐츠', color: 'magenta' },
  [PermissionCategory.SETTLEMENT]: { label: '정산', color: 'gold' },
  [PermissionCategory.STATS]: { label: '통계', color: 'cyan' },
  [PermissionCategory.NOTIFICATION]: { label: '알림', color: 'orange' },
  [PermissionCategory.SYSTEM]: { label: '시스템', color: 'red' },
};

/** 검색/선택 드롭다운용 카테고리 옵션 (공유 패키지 enum 기반) */
export const PERMISSION_CATEGORY_OPTIONS = Object.values(PermissionCategory).map(
  (category) => ({
    value: category,
    label: PERMISSION_CATEGORY_META[category].label,
  }),
);

/**
 * 권한 카탈로그 목 데이터.
 * 실제로는 GET /admins/permissions 로 조회할 예정이며, code 접두사를 카테고리와 일치시킨다.
 */
export const permissionsMock: Permission[] = [
  // 계정
  {
    code: 'account:read',
    name: '계정 조회',
    category: PermissionCategory.ACCOUNT,
    description: '계정 목록과 상세 정보를 조회합니다.',
  },
  {
    code: 'account:write',
    name: '계정 생성/수정',
    category: PermissionCategory.ACCOUNT,
    description: '계정을 생성하거나 정보를 수정합니다.',
  },
  {
    code: 'account:delete',
    name: '계정 삭제',
    category: PermissionCategory.ACCOUNT,
    description: '계정을 삭제(퇴사 처리)합니다.',
  },
  {
    code: 'account:approve',
    name: '계정 승인',
    category: PermissionCategory.ACCOUNT,
    description: '승인 대기 계정에 역할을 부여해 승인합니다.',
  },
  {
    code: 'account:export',
    name: '계정 내보내기',
    category: PermissionCategory.ACCOUNT,
    description: '계정 목록을 파일로 내보냅니다.',
  },
  // 역할
  {
    code: 'role:read',
    name: '역할 조회',
    category: PermissionCategory.ROLE,
    description: '역할 목록과 상세를 조회합니다.',
  },
  {
    code: 'role:write',
    name: '역할 생성/수정',
    category: PermissionCategory.ROLE,
    description: '역할을 생성하거나 수정합니다.',
  },
  {
    code: 'role:delete',
    name: '역할 삭제',
    category: PermissionCategory.ROLE,
    description: '역할을 삭제합니다.',
  },
  {
    code: 'role:assign',
    name: '역할 배정',
    category: PermissionCategory.ROLE,
    description: '계정에 역할을 배정합니다.',
  },
  // 권한
  {
    code: 'permission:read',
    name: '권한 조회',
    category: PermissionCategory.PERMISSION,
    description: '권한 목록을 조회합니다.',
  },
  {
    code: 'permission:write',
    name: '권한 부여/회수',
    category: PermissionCategory.PERMISSION,
    description: '역할에 권한을 부여하거나 회수합니다.',
  },
  // 콘텐츠
  {
    code: 'content:read',
    name: '콘텐츠 조회',
    category: PermissionCategory.CONTENT,
    description: '콘텐츠 목록과 상세를 조회합니다.',
  },
  {
    code: 'content:write',
    name: '콘텐츠 등록/수정',
    category: PermissionCategory.CONTENT,
    description: '콘텐츠를 등록하거나 수정합니다.',
  },
  {
    code: 'content:delete',
    name: '콘텐츠 삭제',
    category: PermissionCategory.CONTENT,
    description: '콘텐츠를 삭제합니다.',
  },
  {
    code: 'content:publish',
    name: '콘텐츠 게시',
    category: PermissionCategory.CONTENT,
    description: '콘텐츠를 게시하거나 게시 취소합니다.',
  },
  {
    code: 'content:review',
    name: '콘텐츠 검수',
    category: PermissionCategory.CONTENT,
    description: '콘텐츠를 검수하고 승인/반려합니다.',
  },
  // 정산
  {
    code: 'settlement:read',
    name: '정산 조회',
    category: PermissionCategory.SETTLEMENT,
    description: '정산 내역을 조회합니다.',
  },
  {
    code: 'settlement:write',
    name: '정산 생성/수정',
    category: PermissionCategory.SETTLEMENT,
    description: '정산을 생성하거나 수정합니다.',
  },
  {
    code: 'settlement:approve',
    name: '정산 승인',
    category: PermissionCategory.SETTLEMENT,
    description: '정산을 승인합니다.',
  },
  {
    code: 'settlement:export',
    name: '정산 내보내기',
    category: PermissionCategory.SETTLEMENT,
    description: '정산 내역을 파일로 내보냅니다.',
  },
  // 통계
  {
    code: 'stats:read',
    name: '통계 조회',
    category: PermissionCategory.STATS,
    description: '통계 대시보드를 조회합니다.',
  },
  {
    code: 'stats:export',
    name: '통계 내보내기',
    category: PermissionCategory.STATS,
    description: '통계 데이터를 파일로 내보냅니다.',
  },
  // 알림
  {
    code: 'notification:read',
    name: '알림 조회',
    category: PermissionCategory.NOTIFICATION,
    description: '발송된 알림 내역을 조회합니다.',
  },
  {
    code: 'notification:write',
    name: '알림 발송',
    category: PermissionCategory.NOTIFICATION,
    description: '알림을 발송합니다.',
  },
  // 시스템
  {
    code: 'system:read',
    name: '시스템 설정 조회',
    category: PermissionCategory.SYSTEM,
    description: '시스템 설정을 조회합니다.',
  },
  {
    code: 'system:write',
    name: '시스템 설정 변경',
    category: PermissionCategory.SYSTEM,
    description: '시스템 설정을 변경합니다.',
  },
  {
    code: 'system:audit',
    name: '감사 로그 조회',
    category: PermissionCategory.SYSTEM,
    description: '감사 로그를 조회합니다.',
  },
];
