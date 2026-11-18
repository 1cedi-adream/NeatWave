export const queryKeys = {
  auth: ["auth"] as const,
  currentUser: ["auth", "me"] as const,
  dashboard: ["dashboard"] as const,
  orders: (filters?: object) => ["orders", filters ?? {}] as const,
  order: (id: string) => ["orders", id] as const,
  customers: (filters?: object) => ["customers", filters ?? {}] as const,
  customer: (id: string) => ["customers", id] as const,
  services: ["services"] as const,
  staff: ["staff"] as const,
  settings: ["settings"] as const,
  notifications: ["notifications"] as const,
  notificationDeliveries: ["notifications", "deliveries"] as const,
  tracking: (token: string) => ["tracking", token] as const,
  adminSummary: ["admin", "summary"] as const,
  adminTenants: (filters?: object) =>
    ["admin", "tenants", filters ?? {}] as const,
  adminTenant: (id: string) => ["admin", "tenants", id] as const,
};
