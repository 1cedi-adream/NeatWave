import type { UserRole } from '../../../types/roles'

export type StaffMember = { id: string; fullName: string; email: string; phone: string; role: UserRole; active: boolean }
