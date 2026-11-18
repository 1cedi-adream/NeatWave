import type { UserRole } from "../../../types/roles";

export type StaffMember = {
  membershipId: string;
  userId: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  active: boolean;
};
