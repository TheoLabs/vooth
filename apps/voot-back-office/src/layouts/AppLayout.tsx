import { useMemo } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Button, ConfigProvider, Layout, Menu, Space, Typography } from 'antd';
import type { MenuProps } from 'antd';
import { useAuth } from '../auth/AuthContext';
import { useMe } from '../features/auth/useMe';
import { MENU_TREE } from './menu';

const { Header, Sider, Content } = Layout;

/** MENU_TREE -> antd Menu items */
const MENU_ITEMS: MenuProps['items'] = MENU_TREE.map((group) => {
  if (group.children) {
    return {
      key: group.key,
      label: group.label,
      children: group.children.map((leaf) => ({ key: leaf.path, label: leaf.label })),
    };
  }
  return { key: group.path!, label: group.label };
});

/** 모든 리프 path (정확 매칭/접두 매칭 판단용), 긴 경로 우선 정렬 */
const LEAF_PATHS: string[] = MENU_TREE.flatMap((group) =>
  group.children ? group.children.map((l) => l.path) : group.path ? [group.path] : [],
).sort((a, b) => b.length - a.length);

/**
 * 인증을 통과한 사용자의 메인 셸.
 * 사이드바 네비(메뉴 IA) + 헤더(브랜드/사용자/로그아웃). 인증 배선(useAuth/useMe)은 유지.
 */
export function AppLayout() {
  const { logout } = useAuth();
  const { data: account } = useMe();
  const navigate = useNavigate();
  const location = useLocation();

  /** 현재 경로에 가장 잘 맞는 메뉴 키와, 그 부모(open) 키 */
  const { selectedKeys, openKeys } = useMemo(() => {
    const pathname = location.pathname;
    const matched =
      LEAF_PATHS.find((p) => p === pathname) ??
      LEAF_PATHS.find((p) => p !== '/' && pathname.startsWith(p)) ??
      '/';
    const parent = MENU_TREE.find((group) => group.children?.some((l) => l.path === matched));
    return {
      selectedKeys: [matched],
      openKeys: parent ? [parent.key] : [],
    };
  }, [location.pathname]);

  return (
    <Layout style={{ height: '100vh', overflow: 'hidden' }}>
      <ConfigProvider
        theme={{
          token: {
            colorPrimary: '#6366f1',
          },
          components: {
            Layout: {
              siderBg: '#0f172a',
              triggerBg: '#0f172a',
            },
            Menu: {
              darkItemBg: '#0f172a',
              darkSubMenuItemBg: '#0b1220',
              darkPopupBg: '#0f172a',
              darkItemColor: 'rgba(226, 232, 240, 0.75)',
              darkGroupTitleColor: 'rgba(148, 163, 184, 0.85)',
              darkItemHoverBg: 'rgba(99, 102, 241, 0.16)',
              darkItemHoverColor: '#ffffff',
              darkItemSelectedBg: '#4f46e5',
              darkItemSelectedColor: '#ffffff',
              itemBorderRadius: 10,
              itemMarginInline: 8,
              itemHeight: 42,
              iconSize: 16,
            },
          },
        }}
      >
        <Sider
          breakpoint="lg"
          collapsedWidth="0"
          theme="dark"
          style={{ overflow: 'auto', background: '#0f172a' }}
        >
          <div
            style={{
              height: 64,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              color: '#fff',
              fontWeight: 700,
              fontSize: 18,
              letterSpacing: 0.4,
            }}
          >
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 28,
                height: 28,
                borderRadius: 8,
                background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                color: '#fff',
                fontSize: 15,
                fontWeight: 800,
                boxShadow: '0 2px 8px rgba(79, 70, 229, 0.45)',
              }}
            >
              V
            </span>
            <span style={{ color: '#f1f5f9' }}>Vooth</span>
          </div>
          <Menu
            theme="dark"
            mode="inline"
            items={MENU_ITEMS}
            selectedKeys={selectedKeys}
            defaultOpenKeys={openKeys}
            onClick={({ key }) => navigate(key)}
            style={{ background: 'transparent', borderInlineEnd: 'none', paddingTop: 4 }}
          />
        </Sider>
      </ConfigProvider>
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
            {account ? <Typography.Text type="secondary">{account.email}</Typography.Text> : null}
            <Button onClick={logout}>로그아웃</Button>
          </Space>
        </Header>
        <Content className="bo-content">
          <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
            <Outlet />
          </div>
        </Content>
      </Layout>
    </Layout>
  );
}
