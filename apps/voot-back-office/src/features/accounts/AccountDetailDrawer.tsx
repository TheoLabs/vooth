import { useEffect, useMemo, useState } from 'react';
import {
  App as AntApp,
  Button,
  Descriptions,
  Drawer,
  Popconfirm,
  Select,
  Space,
  Tag,
  Typography,
} from 'antd';
import { AccountStatus } from '@vooth/shared';
import type { Account } from '../../api/account.api';
import {
  useChangeAccountRole,
  useExitAccount,
  useRejectAccount,
} from './useAccounts';
import { useRoles } from '../roles/useRoles';
import { useMe } from '../auth/useMe';
import {
  ACCOUNT_STATUS_COLOR,
  ACCOUNT_STATUS_LABEL,
  ACCOUNT_TYPE_COLOR,
  ACCOUNT_TYPE_LABEL,
  ROLE_TYPE_LABEL,
} from './labels';

interface AccountDetailDrawerProps {
  account: Account | null;
  open: boolean;
  onClose: () => void;
  /** 승인(역할 선택) 모달 열기 — 모달 로직은 부모(AccountsPage)가 소유한다. */
  onApprove: (account: Account) => void;
}

/** UTC ISO 타임스탬프를 로컬 타임존 문자열로 변환한다. */
function formatLocal(iso?: string): string {
  if (!iso) return '-';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '-';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(
    d.getHours(),
  )}:${pad(d.getMinutes())}`;
}

export function AccountDetailDrawer({
  account,
  open,
  onClose,
  onApprove,
}: AccountDetailDrawerProps) {
  const { message } = AntApp.useApp();

  const reject = useRejectAccount();
  const exit = useExitAccount();
  const changeRole = useChangeAccountRole();

  const { data: rolesData } = useRoles({ page: 1, limit: 100 });
  const roleOptions = useMemo(
    () =>
      (rolesData?.items ?? []).map((role) => ({
        value: role.id,
        label: `${role.name} (${ROLE_TYPE_LABEL[role.type]})`,
      })),
    [rolesData],
  );

  const { data: me } = useMe();

  // 현재 로그인한 본인 계정인지 식별 (id 우선, 없으면 email).
  const isSelf = useMemo(() => {
    if (!account || !me) return false;
    if (me.id != null) return me.id === account.id;
    return !!me.email && me.email === account.email;
  }, [account, me]);

  const [roleDraft, setRoleDraft] = useState<number | undefined>(account?.roleId ?? undefined);

  // 대상 계정이 바뀌면(혹은 목록 갱신으로 roleId 가 바뀌면) draft 동기화.
  useEffect(() => {
    setRoleDraft(account?.roleId ?? undefined);
  }, [account?.id, account?.roleId]);

  // ACTIVE(승인된) 계정 + 본인 아님일 때만 역할 변경 가능 (서버 가드와 일치).
  const canChangeRole = !!account && account.status === AccountStatus.ACTIVE && !isSelf;

  const roleChanged = useMemo(
    () => !!account && roleDraft !== undefined && roleDraft !== account.roleId,
    [account, roleDraft],
  );

  if (!account) {
    return <Drawer open={open} onClose={onClose} maskClosable={false} width={420} />;
  }

  const handleReject = () => {
    reject.mutate(account.id, {
      onSuccess: () => {
        message.success('계정을 반려했습니다.');
        onClose();
      },
      onError: (e) => message.error(e.message),
    });
  };

  const handleExit = () => {
    exit.mutate(account.id, {
      onSuccess: () => {
        message.success('퇴사 처리했습니다.');
        onClose();
      },
      onError: (e) => message.error(e.message),
    });
  };

  const handleChangeRole = () => {
    if (!roleChanged || roleDraft === undefined) {
      message.info('변경된 내용이 없습니다.');
      return;
    }
    changeRole.mutate(
      { id: account.id, roleId: roleDraft },
      {
        onSuccess: () => message.success('역할을 변경했습니다.'),
        onError: (e) => message.error(e.message),
      },
    );
  };

  const busy = reject.isPending || exit.isPending || changeRole.isPending;

  return (
    <Drawer
      title="계정 상세"
      placement="right"
      open={open}
      onClose={onClose}
      maskClosable={false}
      width={420}
    >
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Descriptions column={1} bordered size="small">
          <Descriptions.Item label="이름">{account.name}</Descriptions.Item>
          <Descriptions.Item label="이메일">{account.email}</Descriptions.Item>
          <Descriptions.Item label="타입">
            <Tag color={ACCOUNT_TYPE_COLOR[account.type]}>
              {ACCOUNT_TYPE_LABEL[account.type]}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="상태">
            <Tag color={ACCOUNT_STATUS_COLOR[account.status]}>
              {ACCOUNT_STATUS_LABEL[account.status]}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="역할">
            {account.role ? (
              account.role.name
            ) : (
              <Typography.Text type="secondary">-</Typography.Text>
            )}
          </Descriptions.Item>
          <Descriptions.Item label="가입일">{formatLocal(account.createdAt)}</Descriptions.Item>
        </Descriptions>

        <div>
          <Typography.Text strong>역할 변경</Typography.Text>
          <Space style={{ width: '100%', marginTop: 8 }}>
            <Select
              style={{ minWidth: 240 }}
              placeholder="역할 선택"
              value={roleDraft}
              options={roleOptions}
              onChange={(v) => setRoleDraft(v)}
              disabled={!canChangeRole}
            />
            <Button
              type="primary"
              disabled={!canChangeRole || !roleChanged || changeRole.isPending}
              loading={changeRole.isPending}
              onClick={handleChangeRole}
            >
              변경
            </Button>
          </Space>
          {isSelf ? (
            <Typography.Text type="secondary" style={{ display: 'block', marginTop: 8 }}>
              본인 계정은 역할 변경·퇴사할 수 없습니다.
            </Typography.Text>
          ) : (
            account.status !== AccountStatus.ACTIVE && (
              <Typography.Text type="secondary" style={{ display: 'block', marginTop: 8 }}>
                승인된(활성) 계정만 역할을 변경할 수 있습니다.
              </Typography.Text>
            )
          )}
        </div>

        <div>
          <Typography.Text strong>상태 액션</Typography.Text>
          <div style={{ marginTop: 8 }}>
            {account.status === AccountStatus.PENDING && (
              <Space>
                <Button type="primary" disabled={busy} onClick={() => onApprove(account)}>
                  승인
                </Button>
                <Popconfirm
                  title="이 계정을 반려하시겠습니까?"
                  okText="반려"
                  cancelText="취소"
                  onConfirm={handleReject}
                >
                  <Button danger disabled={busy} loading={reject.isPending}>
                    반려
                  </Button>
                </Popconfirm>
              </Space>
            )}
            {account.status === AccountStatus.ACTIVE &&
              (isSelf ? (
                <Space direction="vertical" size={4}>
                  <Button danger disabled>
                    퇴사
                  </Button>
                  <Typography.Text type="secondary">
                    본인 계정은 역할 변경·퇴사할 수 없습니다.
                  </Typography.Text>
                </Space>
              ) : (
                <Popconfirm
                  title="이 계정을 퇴사 처리하시겠습니까?"
                  okText="퇴사"
                  cancelText="취소"
                  onConfirm={handleExit}
                >
                  <Button danger disabled={busy} loading={exit.isPending}>
                    퇴사
                  </Button>
                </Popconfirm>
              ))}
            {account.status !== AccountStatus.PENDING &&
              account.status !== AccountStatus.ACTIVE && (
                <Typography.Text type="secondary">가능한 상태 액션이 없습니다.</Typography.Text>
              )}
          </div>
        </div>
      </Space>
    </Drawer>
  );
}
