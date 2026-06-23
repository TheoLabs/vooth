import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { useMe } from '../features/me/useMe'
import { useTheme } from '../theme/ThemeContext'
import { NAV_ITEMS } from './menu'
import './AppLayout.css'

/**
 * 인증·승인을 통과한 사용자의 메인 셸.
 * 상단 헤더(브랜드 + 가로 네비 + 사용자/로그아웃), 그 아래 콘텐츠.
 * (이전 좌측 사이드바 네비를 상단 헤더로 올림.)
 */
export function AppLayout(): React.JSX.Element {
  const { logout } = useAuth()
  const { data: me } = useMe()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()

  const handleLogout = (): void => {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="app-brand">
          <span className="app-brand__mark">V</span>
          <span className="app-brand__name">Vooth Tool</span>
        </div>

        <nav className="app-nav">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `app-nav__item${isActive ? ' app-nav__item--active' : ''}`
              }
            >
              <span className="app-nav__icon">{item.icon}</span>
              <span className="app-nav__label">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="app-header__user">
          <button
            type="button"
            className="app-header__theme"
            onClick={toggleTheme}
            title={theme === 'dark' ? '라이트 모드로 전환' : '다크 모드로 전환'}
            aria-label="테마 전환"
          >
            {theme === 'dark' ? '☀' : '☾'}
          </button>
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
  )
}
