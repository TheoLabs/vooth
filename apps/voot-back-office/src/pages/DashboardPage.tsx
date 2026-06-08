import { useAuth } from '../auth/AuthContext';
import { useMe } from '../features/auth/useMe';
import type { MeStatus } from '../api/me.api';
import './dashboard.css';

const STATUS_LABEL: Record<MeStatus, string> = {
  pending: '승인 대기',
  active: '활성',
  exited: '퇴사',
};

export function DashboardPage() {
  const { logout } = useAuth();
  const { data: account } = useMe();

  // ApprovalGate 가 200 성공 시에만 이 페이지를 렌더하므로 account 는 존재한다.
  if (!account) return null;

  const initial = account.email.trim().charAt(0).toUpperCase() || 'U';

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
            <span className="dashboard__avatar">{initial}</span>
            <div>
              <p className="dashboard__name">{account.email}</p>
              <p className="dashboard__email">계정 ID #{account.id}</p>
            </div>
          </div>

          <div>
            <p className="dashboard__label">상태 (Status)</p>
            <div className="dashboard__meta">
              <span className="dashboard__role">
                {STATUS_LABEL[account.status]}
              </span>
            </div>
          </div>

          <div>
            <p className="dashboard__label">역할 (Role)</p>
            <div className="dashboard__meta">
              <span className="dashboard__role">
                {account.roleId !== null
                  ? `Role #${account.roleId}`
                  : '미지정'}
              </span>
            </div>
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
