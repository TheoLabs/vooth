import { useEffect } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { Button, Result, Spin, Typography } from 'antd';
import { useAuth } from '../auth/AuthContext';
import { useMe } from '../features/auth/useMe';
import { ApiError } from '../lib/apiClient';
import { PendingApprovalPage } from '../pages/PendingApprovalPage';

const { Text } = Typography;

const centeredStyle: React.CSSProperties = {
  minHeight: '100vh',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 16,
  padding: 24,
  textAlign: 'center',
};

/**
 * 인증된 사용자의 /admins/me 결과에 따라 보호 영역 접근을 통제한다.
 * - loading      → 중앙 로딩 상태
 * - 200(성공)    → 승인된 계정 → 하위 라우트(대시보드) 진입
 * - 403 + "퇴사" → 퇴사 계정 차단 안내
 * - 403          → 승인 대기 페이지
 * - 401          → 로그아웃 후 로그인 페이지로 이동
 * - 그 외        → 일반 오류 + 다시 시도
 */
export function ApprovalGate() {
  const { logout } = useAuth();
  const { data, isPending, error, refetch, isFetching } = useMe();

  // 401 은 렌더 도중이 아니라 effect 에서 로그아웃 처리한다.
  // (렌더 단계 상태 변경으로 인한 루프 방지)
  const isUnauthorized = error instanceof ApiError && error.status === 401;
  useEffect(() => {
    if (isUnauthorized) logout();
  }, [isUnauthorized, logout]);

  if (isPending) {
    return (
      <div style={centeredStyle}>
        <Spin size="large" />
        <div>
          <Typography.Title level={4} style={{ marginBottom: 4 }}>
            계정 정보를 확인하고 있어요
          </Typography.Title>
          <Text type="secondary">잠시만 기다려 주세요</Text>
        </div>
      </div>
    );
  }

  if (error) {
    if (isUnauthorized) {
      return <Navigate to="/login" replace />;
    }

    if (error instanceof ApiError && error.status === 403) {
      if (error.message.includes('퇴사')) {
        return (
          <div style={centeredStyle}>
            <Result
              status="error"
              title="퇴사한 계정입니다"
              subTitle="이 계정은 더 이상 콘솔에 접근할 수 없습니다."
              extra={
                <Button type="primary" onClick={logout}>
                  로그아웃
                </Button>
              }
            />
          </div>
        );
      }

      return <PendingApprovalPage />;
    }

    return (
      <div style={centeredStyle}>
        <Result
          status="warning"
          title="오류가 발생했습니다"
          subTitle="계정 정보를 불러오지 못했습니다. 잠시 후 다시 시도해주세요."
          extra={
            <Button
              type="primary"
              loading={isFetching}
              onClick={() => {
                void refetch();
              }}
            >
              {isFetching ? '확인 중…' : '다시 시도'}
            </Button>
          }
        />
      </div>
    );
  }

  // 200 성공: roleId 가 배정된 승인 계정 → 대시보드 진입.
  // data 는 useMe 의 캐시에 남아 DashboardPage 에서 그대로 사용한다.
  void data;
  return <Outlet />;
}
