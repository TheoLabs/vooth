import { Button, Card, Space, Steps, Tag, Typography } from 'antd';
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  RocketOutlined,
} from '@ant-design/icons';
import { useAuth } from '../auth/AuthContext';
import { useMe } from '../features/auth/useMe';

const { Title, Text, Paragraph } = Typography;

/**
 * 관리자 승인 대기 화면.
 * 계정 생성은 완료되었으나 역할 승인이 끝나지 않은 상태를 안내한다.
 * 자동 폴링은 하지 않으며, "다시 확인" 버튼으로만 재조회한다.
 */
export function PendingApprovalPage() {
  const { user, logout } = useAuth();
  const { refetch, isFetching } = useMe();

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}
    >
      <Card style={{ width: '100%', maxWidth: 480 }}>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div style={{ textAlign: 'center' }}>
            <Tag color="processing" style={{ marginBottom: 12 }}>
              승인 대기 중
            </Tag>
            <Title level={3} style={{ marginBottom: 8 }}>
              관리자 승인 대기
            </Title>
            <Paragraph type="secondary" style={{ marginBottom: 0 }}>
              계정이 정상적으로 생성되었어요.
              <br />
              관리자가 역할을 승인하면 콘솔을 이용할 수 있습니다.
            </Paragraph>
          </div>

          <Steps
            direction="vertical"
            size="small"
            current={1}
            items={[
              {
                title: '가입 완료',
                description: '계정이 생성되었습니다.',
                status: 'finish',
                icon: <CheckCircleOutlined />,
              },
              {
                title: '승인 대기',
                description: '관리자가 역할을 배정하고 있습니다.',
                status: 'process',
                icon: <ClockCircleOutlined />,
              },
              {
                title: '이용 시작',
                description: '승인 후 콘솔에 접근할 수 있습니다.',
                status: 'wait',
                icon: <RocketOutlined />,
              },
            ]}
          />

          {user && (
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '8px 12px',
                borderRadius: 8,
                background: 'rgba(0, 0, 0, 0.03)',
              }}
            >
              <Text type="secondary">로그인 계정</Text>
              <Text strong>{user.email}</Text>
            </div>
          )}

          <Space style={{ width: '100%', justifyContent: 'center' }}>
            <Button
              type="primary"
              loading={isFetching}
              onClick={() => {
                void refetch();
              }}
            >
              {isFetching ? '확인 중…' : '다시 확인'}
            </Button>
            <Button onClick={logout}>로그아웃</Button>
          </Space>

          <Paragraph
            type="secondary"
            style={{ textAlign: 'center', marginBottom: 0, fontSize: 12 }}
          >
            승인이 지연될 경우 담당 관리자에게 문의해주세요.
          </Paragraph>
        </Space>
      </Card>
    </div>
  );
}
