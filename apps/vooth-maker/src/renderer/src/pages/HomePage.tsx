import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { useMe } from '../features/me/useMe'
import { ApiError } from '../lib/apiClient'
import type { AccountStatus, MeAccount } from '../api/me.api'
import './HomePage.css'

const STATUS_LABELS: Record<AccountStatus, string> = {
  pending: '승인 대기',
  active: '활성',
  exited: '퇴사'
}

function AccountDetails({ account }: { account: MeAccount }): React.JSX.Element {
  return (
    <div className="home-account">
      <p className="home-account-title">내 계정 정보</p>
      <dl>
        <dt>이메일</dt>
        <dd>{account.email}</dd>
        <dt>역할 ID</dt>
        <dd>{account.roleId ?? '미지정'}</dd>
        <dt>상태</dt>
        <dd>
          <span className={`home-status home-status--${account.status}`}>
            {STATUS_LABELS[account.status]}
          </span>
        </dd>
      </dl>
    </div>
  )
}

export function HomePage(): React.JSX.Element {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const { data: account, isLoading, error } = useMe()

  const handleLogout = (): void => {
    logout()
    navigate('/login', { replace: true })
  }

  const renderAccountState = (): React.JSX.Element | null => {
    if (isLoading) {
      return (
        <div className="home-state home-state--loading">
          <span className="home-spinner" aria-hidden="true" />
          <span>계정 정보를 불러오는 중입니다…</span>
        </div>
      )
    }

    if (error) {
      if (error instanceof ApiError && error.status === 401) {
        return (
          <div className="home-state home-state--error">
            <span>인증이 만료되었습니다. 다시 로그인해 주세요.</span>
            <button type="button" className="home-relogin" onClick={handleLogout}>
              다시 로그인
            </button>
          </div>
        )
      }

      if (error instanceof ApiError && error.status === 403) {
        return <div className="home-state home-state--warning">{error.message}</div>
      }

      const message =
        error instanceof ApiError ? error.message : '계정 정보를 불러오지 못했습니다.'
      return <div className="home-state home-state--error">{message}</div>
    }

    if (account) {
      return <AccountDetails account={account} />
    }

    return null
  }

  return (
    <div className="home-page">
      <div className="home-card">
        <h1 className="home-greeting">
          안녕하세요, <span className="home-name">{user?.name}</span>님
        </h1>
        <p className="home-role">역할: {user?.role}</p>

        {renderAccountState()}

        <div className="home-note">
          이 화면은 로그인 이후 보여지는 임시 플레이스홀더 화면입니다.
        </div>

        <button type="button" className="home-logout" onClick={handleLogout}>
          로그아웃
        </button>
      </div>
    </div>
  )
}
