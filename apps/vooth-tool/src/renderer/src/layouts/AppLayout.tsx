import { Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { useMe } from '../features/me/useMe'
import './AppLayout.css'

/**
 * 인증·승인을 통과한 사용자의 메인 셸. 화면은 mock 으로 다시 채울 예정이라
 * 사이드바 네비는 비우고 셸(브랜드/사용자/로그아웃)만 유지한다.
 */
export function AppLayout(): React.JSX.Element {
  const { logout } = useAuth()
  const { data: me } = useMe()
  const navigate = useNavigate()

  const handleLogout = (): void => {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="app-shell">
      <aside className="app-sidebar">
        <div className="app-brand">
          <span className="app-brand__mark">V</span>
          <span className="app-brand__name">Vooth Tool</span>
        </div>
      </aside>

      <div className="app-main">
        <header className="app-header">
          <h1 className="app-header__title">Vooth Tool</h1>
          <div className="app-header__user">
            {me && (
              <div className="app-header__userinfo">
                <span className="app-header__name">{me.name}</span>
                <span className="app-header__email">{me.email}</span>
              </div>
            )}
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
