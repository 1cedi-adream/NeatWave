import type { UserRole } from '../../../types/roles'

export type User = { id: string; name: string; email: string; role: UserRole; active: boolean }
