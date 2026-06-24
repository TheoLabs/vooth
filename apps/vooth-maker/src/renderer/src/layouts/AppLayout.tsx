import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { useMe } from '../features/me/useMe'
import { useTheme } from '../theme/ThemeContext'
import { MAKER_NAV } from './menu'
import './AppLayout.css'

/**
 * 인증·승인을 통과한 사용자의 메인 셸.
 * 상단 헤더에 브랜드 + 가로 네비 + (테마 토글 · 사용자 · 로그아웃). 콘텐츠 영역만 스크롤.
 */
export function AppLayout(): React.JSX.Element {
  const { user, logout } = useAuth()
  const { data: account } = useMe()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()

  const handleLogout = (): void => {
    logout()
    navigate('/login', { replace: true })
  }

  const displayName = account?.nickname ?? user?.email ?? '사용자'

  return (
    <div className="app-shell">
      <header className="app-header">
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
            )
          )}
        </nav>

        <div className="app-header__right">
          <button
            type="button"
            className="app-theme-toggle"
            onClick={toggleTheme}
            title={theme === 'dark' ? '라이트 모드로' : '다크 모드로'}
            aria-label="테마 전환"
          >
            {theme === 'dark' ? '☀' : '☾'}
          </button>
          <div className="app-header__userinfo">
            <span className="app-header__name">{displayName}</span>
            {user?.email && <span className="app-header__email">{user.email}</span>}
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
  )
}
