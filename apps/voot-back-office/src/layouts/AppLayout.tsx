import { useMemo } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { Button, Layout, Menu, Space, Typography } from 'antd';
import {
  DashboardOutlined,
  KeyOutlined,
  SafetyCertificateOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import { useAuth } from '../auth/AuthContext';
import { useMe } from '../features/auth/useMe';

const { Header, Sider, Content } = Layout;

const NAV_ITEMS = [
  { key: '/', icon: <DashboardOutlined />, label: <Link to="/">대시보드</Link> },
  {
    key: '/accounts',
    icon: <TeamOutlined />,
    label: <Link to="/accounts">계정 관리</Link>,
  },
  {
    key: '/roles',
    icon: <SafetyCertificateOutlined />,
    label: <Link to="/roles">Role 관리</Link>,
  },
  {
    key: '/permissions',
    icon: <KeyOutlined />,
    label: <Link to="/permissions">Permission 관리</Link>,
  },
];

export function AppLayout() {
  const { logout } = useAuth();
  const { data: account } = useMe();
  const location = useLocation();

  const selectedKey = useMemo(() => {
    const match = NAV_ITEMS.map((item) => item.key)
      .filter((key) => key !== '/')
      .find((key) => location.pathname.startsWith(key));
    return match ?? '/';
  }, [location.pathname]);

  return (
    <Layout style={{ minHeight: '100vh' }}>
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
        <Content style={{ margin: 24 }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
