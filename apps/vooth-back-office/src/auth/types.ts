/**
 * account / role / permission 도메인을 염두에 둔 인증 사용자 모델.
 * 현재 access token payload 는 { sub, email } 만 담고 있어
 * name / role / permissions 는 선택값으로 둔다 (추후 API 로 보강).
 */
export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  picture?: string;
  /** role 도메인 (예: SUPER_ADMIN, SETTLEMENT_ADMIN, REVIEWER) */
  role?: string;
  /** permission 도메인 (예: account:read, role:write) */
  permissions?: string[];
}
