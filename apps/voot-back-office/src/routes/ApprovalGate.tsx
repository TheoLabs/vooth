import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { useMe } from '../features/auth/useMe';
import { ApiError } from '../lib/apiClient';
import { PendingApprovalPage } from '../pages/PendingApprovalPage';
import './approval-gate.css';

/**
 * 인증된 사용자의 /admins/me 결과에 따라 보호 영역 접근을 통제한다.
 * - loading      → 중앙 로딩 상태
 * - 200(성공)    → 승인된 계정 → 하위 라우트(대시보드) 진입
 * - 403 + "퇴사" → 퇴사 계정 차단 안내
 * - 403          → 승인 대기 페이지
 * - 401          → 로그아웃 후 로그인 페이지로 이동
 * - 그 외        → 일반 오류 + 다시 시도
 */
export function ApprovalGate() {
  const { logout } = useAuth();
  const { data, isPending, error, refetch, isFetching } = useMe();

  if (isPending) {
    return (
      <div className="approval-gate">
        <p className="approval-gate__loading">승인 상태를 확인하는 중…</p>
      </div>
    );
  }

  if (error) {
    if (error instanceof ApiError) {
      if (error.status === 401) {
        logout();
        return <Navigate to="/login" replace />;
      }

      if (error.status === 403) {
        if (error.message.includes('퇴사')) {
          return (
            <div className="approval-gate">
              <div className="approval-gate__notice">
                <h1 className="approval-gate__title">퇴사한 계정입니다</h1>
                <p className="approval-gate__desc">
                  이 계정은 더 이상 콘솔에 접근할 수 없습니다.
                </p>
                <button
                  type="button"
                  className="approval-gate__btn"
                  onClick={logout}
                >
                  로그아웃
                </button>
              </div>
            </div>
          );
        }

        return <PendingApprovalPage />;
      }
    }

    return (
      <div className="approval-gate">
        <div className="approval-gate__notice">
          <h1 className="approval-gate__title">오류가 발생했습니다</h1>
          <p className="approval-gate__desc">
            계정 정보를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.
          </p>
          <button
            type="button"
            className="approval-gate__btn"
            onClick={() => {
              void refetch();
            }}
            disabled={isFetching}
          >
            {isFetching ? '확인 중…' : '다시 시도'}
          </button>
        </div>
      </div>
    );
  }

  // 200 성공: roleId 가 배정된 승인 계정 → 대시보드 진입.
  // data 는 useMe 의 캐시에 남아 DashboardPage 에서 그대로 사용한다.
  void data;
  return <Outlet />;
}
