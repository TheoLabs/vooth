import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { useMe } from '../features/me/useMe'
import { MAKER_NAV } from './menu'
import './AppLayout.css'

/**
 * 인증·승인을 통과한 사용자의 메인 셸. 사이드바 네비 + 헤더(사용자/로그아웃).
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

        <nav className="app-nav">
          {MAKER_NAV.map((item) =>
            item.disabled ? (
              <span key={item.key} className="app-nav__item app-nav__item--disabled">
                <span className="app-nav__icon">{item.icon}</span>
                <span className="app-nav__label">{item.label}</span>
                <span className="app-nav__badge">준비중</span>
              </span>
            ) : (
              <NavLink
                key={item.key}
                to={item.path}
                end
                className={({ isActive }) =>
                  `app-nav__item${isActive ? ' app-nav__item--active' : ''}`
                }
              >
                <span className="app-nav__icon">{item.icon}</span>
                <span className="app-nav__label">{item.label}</span>
              </NavLink>
            ),
          )}
        </nav>
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
