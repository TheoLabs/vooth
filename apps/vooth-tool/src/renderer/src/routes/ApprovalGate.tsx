import { useEffect } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { useMe } from '../features/me/useMe'
import { ApiError } from '../lib/apiClient'
import { PendingApprovalPage } from '../pages/PendingApprovalPage'
import './approval-gate.css'

/**
 * 인증된 사용자의 /creators/me 결과에 따라 보호 영역 접근을 통제한다.
 * - loading   → 중앙 로딩 상태
 * - 200(성공) → 승인된 계정(역할 배정) → 하위 라우트(홈) 진입
 * - 403       → 승인 대기 페이지
 * - 401       → 로그아웃 후 로그인 페이지로 이동
 * - 그 외     → 일반 오류 + 다시 시도
 */
export function ApprovalGate(): React.JSX.Element {
  const { logout } = useAuth()
  const { isLoading, error, refetch, isFetching } = useMe()

  const isUnauthorized = error instanceof ApiError && error.status === 401

  // 401 은 세션 만료/무효 → 로그아웃 부수효과는 렌더가 아닌 이펙트에서 수행한다.
  // (렌더 단계에서 상태를 변경하면 재렌더 루프를 유발할 수 있다.)
  useEffect(() => {
    if (isUnauthorized) {
      logout()
    }
  }, [isUnauthorized, logout])

  if (isLoading) {
    return (
      <div className="approval-gate">
        <div className="approval-gate__loading" role="status" aria-live="polite">
          <span className="approval-gate__spinner" aria-hidden="true" />
          <p className="approval-gate__loading-title">계정 정보를 확인하고 있어요</p>
          <p className="approval-gate__loading-desc">잠시만 기다려 주세요</p>
        </div>
      </div>
    )
  }

  if (error) {
    if (error instanceof ApiError) {
      if (error.status === 401) {
        return <Navigate to="/login" replace />
      }

      if (error.status === 403) {
        return <PendingApprovalPage />
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
              void refetch()
            }}
            disabled={isFetching}
          >
            {isFetching ? '확인 중…' : '다시 시도'}
          </button>
        </div>
      </div>
    )
  }

  // 200 성공: 승인된 계정 → 메인 진입. data 는 useMe 캐시에 남아 AppLayout 에서 재사용된다.
  return <Outlet />
}
