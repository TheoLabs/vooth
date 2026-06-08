export type AccountType = 'ADMIN' | 'VOICE_ACTOR';
export type AccountStatus = 'pending' | 'active' | 'exited';

export interface Account {
  id: number;
  email: string;
  name: string;
  type: AccountType;
  roleId: number | null;
  status: AccountStatus;
  createdAt: string;
}

export const accountsMock: Account[] = [
  {
    id: 1,
    email: 'admin@vooth.io',
    name: '김관리',
    type: 'ADMIN',
    roleId: 1,
    status: 'active',
    createdAt: '2025-01-12',
  },
  {
    id: 2,
    email: 'settlement@vooth.io',
    name: '박정산',
    type: 'ADMIN',
    roleId: 2,
    status: 'active',
    createdAt: '2025-02-03',
  },
  {
    id: 3,
    email: 'reviewer@vooth.io',
    name: '이검수',
    type: 'ADMIN',
    roleId: 3,
    status: 'active',
    createdAt: '2025-02-20',
  },
  {
    id: 4,
    email: 'newadmin@vooth.io',
    name: '최신입',
    type: 'ADMIN',
    roleId: null,
    status: 'pending',
    createdAt: '2025-05-30',
  },
  {
    id: 5,
    email: 'actor.han@vooth.io',
    name: '한성우',
    type: 'VOICE_ACTOR',
    roleId: 4,
    status: 'active',
    createdAt: '2025-03-08',
  },
  {
    id: 6,
    email: 'actor.seo@vooth.io',
    name: '서목소리',
    type: 'VOICE_ACTOR',
    roleId: 4,
    status: 'active',
    createdAt: '2025-03-15',
  },
  {
    id: 7,
    email: 'actor.pending@vooth.io',
    name: '정대기',
    type: 'VOICE_ACTOR',
    roleId: null,
    status: 'pending',
    createdAt: '2025-06-01',
  },
  {
    id: 8,
    email: 'former.admin@vooth.io',
    name: '구퇴사',
    type: 'ADMIN',
    roleId: 2,
    status: 'exited',
    createdAt: '2024-11-22',
  },
  {
    id: 9,
    email: 'former.actor@vooth.io',
    name: '윤퇴장',
    type: 'VOICE_ACTOR',
    roleId: 4,
    status: 'exited',
    createdAt: '2024-12-05',
  },
];
