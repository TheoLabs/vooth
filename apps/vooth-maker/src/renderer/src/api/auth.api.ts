import type { AuthUser } from '../auth/types'
import type { LoginInput } from '../features/auth/login.schema'

interface MockAccount {
  email: string
  password: string
  user: AuthUser
}

const MOCK_ACCOUNTS: MockAccount[] = [
  {
    email: 'admin@vooth.com',
    password: 'password123',
    user: {
      id: 'acc_1',
      email: 'admin@vooth.com',
      name: '슈퍼 관리자',
      role: 'SUPER_ADMIN',
      permissions: ['account:read', 'account:write', 'role:write']
    }
  },
  {
    email: 'actor@vooth.com',
    password: 'password123',
    user: {
      id: 'acc_2',
      email: 'actor@vooth.com',
      name: '김성우',
      role: 'VOICE_ACTOR',
      permissions: ['project:read']
    }
  }
]

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function mockLogin(
  input: LoginInput
): Promise<{ user: AuthUser; accessToken: string }> {
  await delay(800)

  const account = MOCK_ACCOUNTS.find(
    (acc) => acc.email === input.email && acc.password === input.password
  )

  if (!account) {
    throw new Error('이메일 또는 비밀번호가 올바르지 않습니다.')
  }

  return { user: account.user, accessToken: 'mock-token' }
}
