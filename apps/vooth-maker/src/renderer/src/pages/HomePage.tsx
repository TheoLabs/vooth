import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import './HomePage.css'

export function HomePage(): React.JSX.Element {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = (): void => {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="home-page">
      <div className="home-card">
        <h1 className="home-greeting">
          안녕하세요, <span className="home-name">{user?.name}</span>님
        </h1>
        <p className="home-role">역할: {user?.role}</p>

        <p className="home-section-title">권한 (Permissions)</p>
        <ul className="home-perms">
          {user?.permissions.map((perm) => (
            <li key={perm}>{perm}</li>
          ))}
        </ul>

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
