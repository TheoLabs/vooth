import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, Card, Col, Empty, Row, Select, Space, Statistic, Tag, Typography, message } from 'antd';
import { TeamOutlined, ClockCircleOutlined, ReadOutlined, TagsOutlined } from '@ant-design/icons';
import { AccountStatus, AccountType } from '@vooth/shared';
import { useAccounts } from '../features/accounts/useAccounts';
import { useApproveAccount } from '../features/accounts/useApproveAccount';
import { useRoles } from '../features/roles/useRoles';
import { useContents } from '../features/contents/useContents';
import { useTags } from '../features/tags/useTags';
import { ROLE_TYPE_META } from '../mocks/roles.mock';
import type { AccountListItem } from '../api/accounts.api';
import type { RoleListItem } from '../api/roles.api';

const TYPE_META: Record<AccountType, { label: string; color: string }> = {
  [AccountType.ADMIN]: { label: '관리자', color: 'geekblue' },
  [AccountType.CREATOR]: { label: '크리에이터', color: 'green' },
};

const ROLE_PICKER_LIMIT = 100;
const PENDING_LIMIT = 50;

/** createdAt 은 UTC(ISO) → 로컬 날짜로 표시. */
function formatDate(value?: string): string {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function roleLabel(role: RoleListItem): string {
  return `${role.name} (${ROLE_TYPE_META[role.type].label})`;
}

/** 승인 대기 계정 1건 카드: 역할 선택 후 즉시 승인. */
function PendingAccountCard({ account, roles }: { account: AccountListItem; roles: RoleListItem[] }) {
  const [roleId, setRoleId] = useState<number>();
  const approve = useApproveAccount();

  const initial = (account.name?.trim()?.charAt(0) || account.email.charAt(0)).toUpperCase();
  const typeMeta = TYPE_META[account.type] ?? { label: '알 수 없음', color: 'default' };

  const handleApprove = () => {
    if (roleId === undefined) return;
    approve.mutate(
      { id: account.id, payload: { roleId } },
      {
        onSuccess: () => message.success(`${account.name || account.email} 계정을 승인했습니다.`),
        onError: (err) => message.error(err.message),
      },
    );
  };

  return (
    <Card size="small">
      <Space direction="vertical" size="small" style={{ width: '100%' }}>
        <Space align="center">
          <span
            style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              background: '#1677ff',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              flex: '0 0 auto',
            }}
          >
            {initial}
          </span>
          <div style={{ minWidth: 0 }}>
            <Typography.Text strong ellipsis style={{ display: 'block' }}>
              {account.name || '(이름 없음)'}
            </Typography.Text>
            <Typography.Text type="secondary" ellipsis style={{ display: 'block', fontSize: 12 }}>
              {account.email}
            </Typography.Text>
          </div>
        </Space>

        <Space size={[8, 4]} wrap>
          <Tag color={typeMeta.color}>{typeMeta.label}</Tag>
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            가입일 {formatDate(account.createdAt)}
          </Typography.Text>
        </Space>

        <Select
          size="small"
          placeholder="부여할 역할 선택"
          style={{ width: '100%' }}
          value={roleId}
          onChange={setRoleId}
          options={roles.map((r) => ({ value: r.id, label: roleLabel(r) }))}
        />
        <Button
          type="primary"
          block
          size="small"
          disabled={roleId === undefined}
          loading={approve.isPending}
          onClick={handleApprove}
        >
          승인
        </Button>
      </Space>
    </Card>
  );
}

export function DashboardPage() {
  const pending = useAccounts({ page: 1, limit: PENDING_LIMIT, statuses: [AccountStatus.PENDING] });
  const allAccounts = useAccounts({ page: 1, limit: 1 });
  const contents = useContents({ page: 1, limit: 1 });
  const tags = useTags({ page: 1, limit: 1 });
  const { data: rolesData } = useRoles({ page: 1, limit: ROLE_PICKER_LIMIT });
  const roles = rolesData?.items ?? [];

  const pendingItems = pending.data?.items ?? [];
  const pendingTotal = pending.data?.total ?? 0;

  return (
    <div style={{ height: '100%', overflowY: 'auto' }}>
      <Typography.Title level={3} style={{ marginTop: 0 }}>
        대시보드
      </Typography.Title>

      {/* 핵심 지표 */}
      <Row gutter={[16, 16]}>
        <Col xs={12} md={6}>
          <Card loading={allAccounts.isLoading}>
            <Statistic title="전체 계정" value={allAccounts.data?.total ?? 0} prefix={<TeamOutlined />} />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card loading={pending.isLoading}>
            <Statistic
              title="승인 대기"
              value={pendingTotal}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: pendingTotal > 0 ? '#fa8c16' : undefined }}
            />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card loading={contents.isLoading}>
            <Statistic title="콘텐츠(작품)" value={contents.data?.total ?? 0} prefix={<ReadOutlined />} />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card loading={tags.isLoading}>
            <Statistic title="태그" value={tags.data?.total ?? 0} prefix={<TagsOutlined />} />
          </Card>
        </Col>
      </Row>

      {/* 승인 대기 계정 */}
      <Space align="center" style={{ width: '100%', justifyContent: 'space-between', margin: '24px 0 12px' }}>
        <Typography.Title level={4} style={{ margin: 0 }}>
          승인 대기 계정 <Typography.Text type="secondary">({pendingTotal})</Typography.Text>
        </Typography.Title>
        <Link to="/accounts">계정 관리로 이동 →</Link>
      </Space>

      {pendingItems.length === 0 ? (
        <Card>
          <Empty description="승인 대기 중인 계정이 없습니다." image={Empty.PRESENTED_IMAGE_SIMPLE} />
        </Card>
      ) : (
        <Row gutter={[16, 16]}>
          {pendingItems.map((account) => (
            <Col key={account.id} xs={24} sm={12} md={8} xl={6}>
              <PendingAccountCard account={account} roles={roles} />
            </Col>
          ))}
        </Row>
      )}
    </div>
  );
}
