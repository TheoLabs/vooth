import { useMemo } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { Breadcrumb, Button, Layout, Menu, Space, Typography } from 'antd';
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

// pathname 접두사 → 강조할 메뉴 키. 상세/편집 경로(예: /content/contents/:id)도
// 해당 메뉴(작품 관리)로 매핑한다. 더 구체적인 경로를 먼저 둔다.
const MENU_KEY_BY_PREFIX: [string, string][] = [
  ['/accounts', '/accounts'],
  ['/roles', '/roles'],
  ['/permissions', '/permissions'],
  ['/content/tags', '/content/tags'],
  ['/content/webtoons', '/content/webtoons'],
  ['/content/contents', '/content/webtoons'],
  ['/content/episodes', '/content/webtoons'],
];

// 경로별 Breadcrumb(메뉴 깊이). 더 구체적인 규칙을 먼저 둔다. to 가 있으면 링크.
const BREADCRUMB_RULES: { test: RegExp; trail: { title: string; to?: string }[] }[] = [
  { test: /^\/$/, trail: [{ title: '대시보드' }] },
  { test: /^\/accounts/, trail: [{ title: '계정' }, { title: '계정 관리' }] },
  { test: /^\/roles/, trail: [{ title: '계정' }, { title: '역할 관리' }] },
  { test: /^\/permissions/, trail: [{ title: '계정' }, { title: '권한 관리' }] },
  { test: /^\/content\/tags/, trail: [{ title: '콘텐츠' }, { title: '태그 관리' }] },
  {
    test: /^\/content\/contents\//,
    trail: [{ title: '콘텐츠' }, { title: '작품 관리', to: '/content/webtoons' }, { title: '콘텐츠 상세' }],
  },
  {
    test: /^\/content\/webtoons\//,
    trail: [{ title: '콘텐츠' }, { title: '작품 관리', to: '/content/webtoons' }, { title: '작품 상세' }],
  },
  {
    test: /^\/content\/episodes\//,
    trail: [{ title: '콘텐츠' }, { title: '작품 관리', to: '/content/webtoons' }, { title: '회차 편집' }],
  },
  { test: /^\/content\/webtoons/, trail: [{ title: '콘텐츠' }, { title: '작품 관리' }] },
  { test: /^\/content/, trail: [{ title: '콘텐츠' }, { title: '작품 관리', to: '/content/webtoons' }] },
];

export function AppLayout() {
  const { logout } = useAuth();
  const { data: account } = useMe();
  const location = useLocation();

  const selectedKey = useMemo(() => {
    const match = MENU_KEY_BY_PREFIX.find(([prefix]) => location.pathname.startsWith(prefix));
    return match?.[1] ?? '/';
  }, [location.pathname]);

  const breadcrumbItems = useMemo(() => {
    // 이동 가능한 크럼은 링크색(파란색)으로 표시해 클릭 가능함을 알린다.
    const crumbLink = (to: string, label: string) => (
      <Link to={to} style={{ color: '#1677ff' }}>
        {label}
      </Link>
    );

    const path = location.pathname;
    // 회차 상세: /content/contents/:contentId/episodes/:id → 콘텐츠 상세로 링크.
    const epMatch = path.match(/^\/content\/contents\/(\d+)\/episodes\//);
    if (epMatch) {
      return [
        { title: '콘텐츠' },
        { title: crumbLink('/content/webtoons', '작품 관리') },
        { title: crumbLink(`/content/contents/${epMatch[1]}`, '콘텐츠 상세') },
        { title: '회차 상세' },
      ];
    }
    const rule = BREADCRUMB_RULES.find((r) => r.test.test(path));
    const trail = rule?.trail ?? [{ title: '대시보드' }];
    return trail.map((t, i) => ({
      // 마지막(현재 페이지)은 일반 텍스트, 그 외 to 가 있으면 링크(파란색).
      title: t.to && i < trail.length - 1 ? crumbLink(t.to, t.title) : t.title,
    }));
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
          <Breadcrumb items={breadcrumbItems} style={{ marginBottom: 16 }} />
          <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
            <Outlet />
          </div>
        </Content>
      </Layout>
    </Layout>
  );
}
