export type Tenant = {
  id: string;
  name: string;
  slug: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};
export type AdminSummary = {
  totalTenants: number;
  activeTenants: number;
  inactiveTenants: number;
  totalCustomers: number;
  totalOrders: number;
  totalOrderValuePesewas: number;
  recentTenants: Tenant[];
};
export type TenantDetail = Tenant & {
  settings: {
    businessName: string;
    address: string;
    phone: string;
    email: string;
  } | null;
  memberships: { role: "manager" | "staff"; active: boolean; value: number }[];
  customerCount: number;
  orderCount: number;
  managerInvitation: {
    email: string;
    role: string;
    expiresAt: string;
    acceptedAt: string | null;
  } | null;
};
