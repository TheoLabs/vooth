import { useAuth } from '../auth/AuthContext'
import { useMe } from '../features/me/useMe'
import './pending-approval.css'

export function PendingApprovalPage(): React.JSX.Element {
  const { user, logout } = useAuth()
  const { refetch, isFetching } = useMe()

  return (
    <div className="pending">
      <div className="pending__card">
        <span className="pending__brand">Vooth Maker</span>
        <span className="pending__icon" aria-hidden="true">
          ⏳
        </span>
        <h1 className="pending__title">관리자 승인 대기</h1>
        <p className="pending__desc">
          회원가입이 완료되었어요. 현재 계정에 역할이 배정되기를 기다리는 중입니다.
          <br />
          관리자가 승인하면 바로 Vooth Maker 를 이용할 수 있어요.
        </p>

        <ol className="pending__steps" aria-label="가입 진행 상태">
          <li className="pending__step pending__step--done">
            <span className="pending__step-dot" aria-hidden="true" />
            <span className="pending__step-label">가입 완료</span>
          </li>
          <li className="pending__step pending__step--current" aria-current="step">
            <span className="pending__step-dot" aria-hidden="true" />
            <span className="pending__step-label">승인 대기</span>
          </li>
          <li className="pending__step">
            <span className="pending__step-dot" aria-hidden="true" />
            <span className="pending__step-label">이용 시작</span>
          </li>
        </ol>

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
              void refetch()
            }}
            disabled={isFetching}
          >
            {isFetching ? '확인 중…' : '다시 확인'}
          </button>
          <button type="button" className="pending__btn pending__btn--ghost" onClick={logout}>
            로그아웃
          </button>
        </div>

        <p className="pending__hint">승인이 지연될 경우 담당 관리자에게 문의해주세요.</p>
      </div>
    </div>
  )
}
