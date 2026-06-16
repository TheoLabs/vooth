import { Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { useMe } from '../features/me/useMe'
import './AppLayout.css'

/**
 * 인증·승인을 통과한 사용자의 메인 셸. 화면은 mock 으로 다시 채울 예정이라
 * 사이드바 네비는 비우고 셸(브랜드/사용자/로그아웃)만 유지한다.
 */
export function AppLayout(): React.JSX.Element {
  const { user, logout } = useAuth()
  const { data: account } = useMe()
  const navigate = useNavigate()

  const handleLogout = (): void => {
    logout()
    navigate('/login', { replace: true })
  }

  const displayName = account?.name ?? user?.email ?? '사용자'

  return (
    <div className="app-shell">
      <aside className="app-sidebar">
        <div className="app-brand">
          <span className="app-brand__mark">V</span>
          <span className="app-brand__name">Vooth Maker</span>
        </div>
      </aside>

      <div className="app-main">
        <header className="app-header">
          <h1 className="app-header__title">Vooth Maker</h1>
          <div className="app-header__user">
            <div className="app-header__userinfo">
              <span className="app-header__name">{displayName}</span>
              {account?.email && <span className="app-header__email">{account.email}</span>}
            </div>
            <button type="button" className="app-header__logout" onClick={handleLogout}>
              로그아웃
            </button>
          </div>
        </header>

        <main className="app-content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
