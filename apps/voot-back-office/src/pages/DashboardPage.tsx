import { useAuth } from '../auth/AuthContext';
import './dashboard.css';

export function DashboardPage() {
  const { user, logout } = useAuth();

  if (!user) return null;

  const initial = user.name.trim().charAt(0).toUpperCase() || 'U';

  return (
    <div className="dashboard">
      <div className="dashboard__inner">
        <header className="dashboard__header">
          <h1 className="dashboard__title">Vooth Back Office</h1>
          <button type="button" className="dashboard__logout" onClick={logout}>
            로그아웃
          </button>
        </header>

        <section className="dashboard__card">
          <div className="dashboard__user">
            {user.picture ? (
              <img className="dashboard__avatar" src={user.picture} alt={user.name} />
            ) : (
              <span className="dashboard__avatar">{initial}</span>
            )}
            <div>
              <p className="dashboard__name">{user.name}</p>
              <p className="dashboard__email">{user.email}</p>
            </div>
          </div>

          <div>
            <p className="dashboard__label">역할 (Role)</p>
            <div className="dashboard__meta">
              <span className="dashboard__role">{user.role}</span>
            </div>
          </div>

          <div>
            <p className="dashboard__label">권한 (Permissions)</p>
            {user.permissions.length > 0 ? (
              <ul className="dashboard__perms">
                {user.permissions.map((perm) => (
                  <li key={perm} className="dashboard__perm">
                    {perm}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="dashboard__note">부여된 권한이 없습니다.</p>
            )}
          </div>
        </section>

        <p className="dashboard__note">
          이 페이지는 임시 대시보드입니다. account / role / permission 도메인 화면이
          추가될 예정입니다.
        </p>
      </div>
    </div>
  );
}
