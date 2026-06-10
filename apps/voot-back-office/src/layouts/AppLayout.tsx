import { useMemo } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { Button, Layout, Menu, Space, Typography } from 'antd';
import {
  DashboardOutlined,
  KeyOutlined,
  ReadOutlined,
  SafetyCertificateOutlined,
  TagsOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import { useAuth } from '../auth/AuthContext';
import { useMe } from '../features/auth/useMe';

const { Header, Sider, Content } = Layout;

const NAV_ITEMS = [
  { key: '/', icon: <DashboardOutlined />, label: <Link to="/">대시보드</Link> },
  {
    // 접히지 않는 그룹 헤더. 하위 항목이 항상 펼쳐진 채로 노출된다.
    key: 'account-group',
    type: 'group' as const,
    label: '계정',
    children: [
      {
        key: '/accounts',
        icon: <TeamOutlined />,
        label: <Link to="/accounts">계정 관리</Link>,
      },
      {
        key: '/roles',
        icon: <SafetyCertificateOutlined />,
        label: <Link to="/roles">역할 관리</Link>,
      },
      {
        key: '/permissions',
        icon: <KeyOutlined />,
        label: <Link to="/permissions">권한 관리</Link>,
      },
    ],
  },
  {
    key: 'content-group',
    type: 'group' as const,
    label: '콘텐츠',
    children: [
      {
        key: '/content/webtoons',
        icon: <ReadOutlined />,
        label: <Link to="/content/webtoons">작품 관리</Link>,
      },
      {
        key: '/content/tags',
        icon: <TagsOutlined />,
        label: <Link to="/content/tags">태그 관리</Link>,
      },
    ],
  },
];

// 선택 표시에 사용할 리프(실제 경로) 키 목록. 더 구체적인 경로를 먼저 둔다.
const LEAF_KEYS = ['/accounts', '/roles', '/permissions', '/content/tags', '/content/webtoons'];

export function AppLayout() {
  const { logout } = useAuth();
  const { data: account } = useMe();
  const location = useLocation();

  const selectedKey = useMemo(() => {
    const match = LEAF_KEYS.find((key) => location.pathname.startsWith(key));
    return match ?? '/';
  }, [location.pathname]);

  return (
    <Layout style={{ height: '100vh', overflow: 'hidden' }}>
      <Sider breakpoint="lg" collapsedWidth="0" theme="dark">
        <div
          style={{
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontWeight: 700,
            fontSize: 16,
          }}
        >
          Vooth
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[selectedKey]}
          items={NAV_ITEMS}
        />
      </Sider>
      <Layout>
        <Header
          style={{
            background: '#fff',
            paddingInline: 24,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Typography.Title level={4} style={{ margin: 0 }}>
            Vooth Back Office
          </Typography.Title>
          <Space size="middle">
            {account ? (
              <Typography.Text type="secondary">{account.email}</Typography.Text>
            ) : null}
            <Button onClick={logout}>로그아웃</Button>
          </Space>
        </Header>
        <Content className="bo-content">
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
