import { useAuth } from '../auth/AuthContext';
import { useMe } from '../features/auth/useMe';
import './pending-approval.css';

export function PendingApprovalPage() {
  const { user, logout } = useAuth();
  const { refetch, isFetching } = useMe();

  return (
    <div className="pending">
      <div className="pending__card">
        <span className="pending__icon" aria-hidden="true">
          ⏳
        </span>
        <h1 className="pending__title">관리자 승인 대기</h1>
        <p className="pending__desc">
          계정이 정상적으로 생성되었지만 아직 역할이 배정되지 않았습니다.
          <br />
          관리자가 승인하면 콘솔을 이용할 수 있습니다.
        </p>

        {user && (
          <div className="pending__account">
            <span className="pending__account-label">로그인 계정</span>
            <span className="pending__account-email">{user.email}</span>
          </div>
        )}

        <div className="pending__actions">
          <button
            type="button"
            className="pending__btn pending__btn--primary"
            onClick={() => {
              void refetch();
            }}
            disabled={isFetching}
          >
            {isFetching ? '확인 중…' : '다시 확인'}
          </button>
          <button
            type="button"
            className="pending__btn pending__btn--ghost"
            onClick={logout}
          >
            로그아웃
          </button>
        </div>

        <p className="pending__hint">
          승인이 지연될 경우 담당 관리자에게 문의해주세요.
        </p>
      </div>
    </div>
  );
}
