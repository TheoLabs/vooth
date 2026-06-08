/**
 * account / role / permission 도메인을 염두에 둔 인증 사용자 모델.
 * 백엔드 연동 시 실제 API 응답 스키마로 교체된다.
 */
export interface AuthUser {
  id: string;
  email: string;
  name: string;
  picture?: string;
  /** role 도메인 (예: SUPER_ADMIN, SETTLEMENT_ADMIN, REVIEWER) */
  role: string;
  /** permission 도메인 (예: account:read, role:write) */
  permissions: string[];
}
