import { permissionsMock, type Permission } from '../mocks/permissions.mock';

/** 권한 단건 모델. (백엔드 Permission 과 1:1 매핑: code/name/category/description) */
export type PermissionItem = Permission;

/**
 * 할당 가능한 전체 권한 목록을 조회한다.
 *
 * TODO(core-api): 백엔드 권한 API 가 준비되면 아래 목 반환을
 *   `apiRequest<PermissionItem[]>('/admins/permissions')` 로 교체한다.
 */
export async function fetchPermissionCatalog(): Promise<PermissionItem[]> {
  return permissionsMock;
}
