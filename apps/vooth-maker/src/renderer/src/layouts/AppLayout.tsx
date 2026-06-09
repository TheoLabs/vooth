import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { useMe } from '../features/me/useMe'
import './AppLayout.css'

interface NavItemDef {
  to: string
  label: string
  icon: string
  /** 아직 구현되지 않은 섹션은 비활성화로 구조만 노출한다. */
  disabled?: boolean
}

const NAV_ITEMS: NavItemDef[] = [
  { to: '/', label: '작업 목록', icon: '🎬' },
  { to: '/record', label: '녹음', icon: '🎙️', disabled: true },
  { to: '/settings', label: '설정', icon: '⚙️', disabled: true }
]

/**
 * 인증·승인을 통과한 사용자가 머무는 메인 데스크톱 레이아웃.
 * 좌측 사이드바(네비) + 상단 헤더(사용자/로그아웃) + 콘텐츠 영역(<Outlet/>).
 * 콘텐츠 영역만 내부 스크롤되며, 윈도우 자체에는 스크롤이 생기지 않는다.
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
          {NAV_ITEMS.map((item) =>
            item.disabled ? (
              <span key={item.to} className="app-nav__item app-nav__item--disabled">
                <span className="app-nav__icon" aria-hidden="true">
                  {item.icon}
                </span>
                <span className="app-nav__label">{item.label}</span>
                <span className="app-nav__badge">준비중</span>
              </span>
            ) : (
              <NavLink
                key={item.to}
                to={item.to}
                end
                className={({ isActive }) =>
                  isActive ? 'app-nav__item app-nav__item--active' : 'app-nav__item'
                }
              >
                <span className="app-nav__icon" aria-hidden="true">
                  {item.icon}
                </span>
                <span className="app-nav__label">{item.label}</span>
              </NavLink>
            )
          )}
        </nav>
      </aside>

      <div className="app-main">
        <header className="app-header">
          <h1 className="app-header__title">작업 목록</h1>
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
