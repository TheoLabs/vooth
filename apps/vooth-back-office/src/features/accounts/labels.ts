import { AccountStatus, AccountType, RoleType, PermissionCategory } from '@vooth/shared';

export const ACCOUNT_STATUS_LABEL: Record<AccountStatus, string> = {
  [AccountStatus.PENDING]: '승인 대기',
  [AccountStatus.REJECTED]: '반려',
  [AccountStatus.ACTIVE]: '활성',
  [AccountStatus.EXITED]: '퇴사',
};

export const ACCOUNT_STATUS_COLOR: Record<AccountStatus, string> = {
  [AccountStatus.PENDING]: 'gold',
  [AccountStatus.REJECTED]: 'red',
  [AccountStatus.ACTIVE]: 'green',
  [AccountStatus.EXITED]: 'default',
};

export const ACCOUNT_TYPE_LABEL: Record<AccountType, string> = {
  [AccountType.ADMIN]: '관리자',
  [AccountType.CREATOR]: '크리에이터',
};

export const ACCOUNT_TYPE_COLOR: Record<AccountType, string> = {
  [AccountType.ADMIN]: 'blue',
  [AccountType.CREATOR]: 'purple',
};

export const ROLE_TYPE_LABEL: Record<RoleType, string> = {
  [RoleType.SUPER]: '슈퍼 관리자',
  [RoleType.ACCOUNT_MANAGER]: '계정 관리자',
  [RoleType.CONTENT_MANAGER]: '콘텐츠 관리자',
  [RoleType.SETTLEMENT_MANAGER]: '정산 관리자',
  [RoleType.STATS_MANAGER]: '통계 관리자',
  [RoleType.NOTIFICATION_MANAGER]: '알림 관리자',
  [RoleType.CREATOR]: '크리에이터',
};

export const PERMISSION_CATEGORY_LABEL: Record<PermissionCategory, string> = {
  [PermissionCategory.ACCOUNT]: '계정',
  [PermissionCategory.ROLE]: '역할',
  [PermissionCategory.PERMISSION]: '권한',
  [PermissionCategory.CONTENT]: '콘텐츠',
  [PermissionCategory.SETTLEMENT]: '정산',
  [PermissionCategory.STATS]: '통계',
  [PermissionCategory.NOTIFICATION]: '알림',
  [PermissionCategory.SYSTEM]: '시스템',
};

export const PERMISSION_CATEGORY_COLOR: Record<PermissionCategory, string> = {
  [PermissionCategory.ACCOUNT]: 'blue',
  [PermissionCategory.ROLE]: 'geekblue',
  [PermissionCategory.PERMISSION]: 'purple',
  [PermissionCategory.CONTENT]: 'green',
  [PermissionCategory.SETTLEMENT]: 'gold',
  [PermissionCategory.STATS]: 'cyan',
  [PermissionCategory.NOTIFICATION]: 'volcano',
  [PermissionCategory.SYSTEM]: 'red',
};

export const ACCOUNT_STATUS_OPTIONS = Object.values(AccountStatus).map((value) => ({
  value,
  label: ACCOUNT_STATUS_LABEL[value],
}));

export const ACCOUNT_TYPE_OPTIONS = Object.values(AccountType).map((value) => ({
  value,
  label: ACCOUNT_TYPE_LABEL[value],
}));

export const ROLE_TYPE_OPTIONS = Object.values(RoleType).map((value) => ({
  value,
  label: ROLE_TYPE_LABEL[value],
}));

export const PERMISSION_CATEGORY_OPTIONS = Object.values(PermissionCategory).map((value) => ({
  value,
  label: PERMISSION_CATEGORY_LABEL[value],
}));
