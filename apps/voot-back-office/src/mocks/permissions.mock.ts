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
