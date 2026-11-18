import type { UserRole } from "../../../types/roles";

export type User = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  active: boolean;
};

export type BackendRole = "super_admin" | "manager" | "staff";

export type CurrentUser = {
  id: string;
  name: string;
  email: string;
  platformRole: "super_admin" | "user";
  tenantId: string | null;
  tenantRole: "manager" | "staff" | null;
};

export type AuthSession = {
  user: User;
  accessToken: string;
  refreshToken: string;
};
