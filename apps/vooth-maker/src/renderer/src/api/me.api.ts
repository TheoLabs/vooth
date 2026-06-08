import { apiRequest } from '../lib/apiClient'

export type AccountStatus = 'pending' | 'active' | 'exited'

export interface MeAccount {
  id: number
  email: string
  googleSub: string
  roleId: number | null
  status: AccountStatus
  createdAt: string
  updatedAt: string
  deletedAt: string | null
}

export function fetchMe(): Promise<MeAccount> {
  return apiRequest<MeAccount>('/admins/me')
}
