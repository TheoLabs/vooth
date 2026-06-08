export interface Role {
  id: number;
  code: string;
  name: string;
  description: string;
}

export const rolesMock: Role[] = [
  {
    id: 1,
    code: 'SUPER_ADMIN',
    name: '슈퍼 관리자',
    description: '모든 기능에 접근 가능한 최고 권한 관리자',
  },
  {
    id: 2,
    code: 'SETTLEMENT_ADMIN',
    name: '정산 관리자',
    description: '정산 및 계정 조회 권한을 가진 관리자',
  },
  {
    id: 3,
    code: 'REVIEWER',
    name: '검수 담당자',
    description: '콘텐츠 검수 및 계정 조회 권한',
  },
  {
    id: 4,
    code: 'VOICE_ACTOR',
    name: '성우',
    description: '성우 작업 영역에만 접근 가능',
  },
];

const roleById = new Map(rolesMock.map((role) => [role.id, role]));

export function findRole(roleId: number | null): Role | undefined {
  if (roleId === null) return undefined;
  return roleById.get(roleId);
}
