import { RoleType } from '@vooth/shared';

export interface Role {
  id: number;
  type: RoleType;
  name: string;
  description: string;
}

export const rolesMock: Role[] = [
  {
    id: 1,
    type: RoleType.SUPER,
    name: '슈퍼 관리자',
    description: '모든 기능에 접근 가능한 최고 권한 관리자',
  },
  {
    id: 2,
    type: RoleType.SUPER,
    name: '정산 관리자',
    description: '정산 및 계정 조회 권한을 가진 관리자',
  },
  {
    id: 3,
    type: RoleType.SUPER,
    name: '검수 담당자',
    description: '콘텐츠 검수 및 계정 조회 권한',
  },
  {
    id: 4,
    type: RoleType.CREATOR,
    name: '성우',
    description: '성우 작업 영역에만 접근 가능',
  },
];

/** RoleType 표시 메타 (라벨/태그 색상) */
export const ROLE_TYPE_META: Record<RoleType, { label: string; color: string }> =
  {
    [RoleType.SUPER]: { label: '슈퍼 관리자', color: 'geekblue' },
    [RoleType.ACCOUNT_MANAGER]: { label: '계정 관리자', color: 'blue' },
    [RoleType.CONTENT_MANAGER]: { label: '콘텐츠 관리자', color: 'cyan' },
    [RoleType.SETTLEMENT_MANAGER]: { label: '정산 관리자', color: 'gold' },
    [RoleType.STATS_MANAGER]: { label: '통계 관리자', color: 'purple' },
    [RoleType.NOTIFICATION_MANAGER]: { label: '알림 관리자', color: 'volcano' },
    [RoleType.CREATOR]: { label: '크리에이터', color: 'green' },
  };

/** 검색/선택 드롭다운용 RoleType 옵션 (공유 패키지 enum 기반) */
export const ROLE_TYPE_OPTIONS = Object.values(RoleType).map((type) => ({
  value: type,
  label: ROLE_TYPE_META[type].label,
}));

const roleById = new Map(rolesMock.map((role) => [role.id, role]));

export function findRole(roleId: number | null): Role | undefined {
  if (roleId === null) return undefined;
  return roleById.get(roleId);
}
