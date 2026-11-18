export const realtimeEventTypes = [
  "orders.changed",
  "tracking.order-status.changed",
  "customers.changed",
  "services.changed",
  "staff.changed",
  "settings.changed",
  "notifications.changed",
  "notifications.delivery.changed",
  "platform.summary.changed",
  "admin.tenants.changed",
  "profile.changed",
  "access.revoked",
] as const;

export type RealtimeEventType = (typeof realtimeEventTypes)[number];

export type RealtimeEvent = {
  id: number;
  type: RealtimeEventType;
  payload: Record<string, unknown>;
  createdAt: string;
};

export const realtimeRooms = {
  tenant: (tenantId: string) => `tenant:${tenantId}`,
  user: (userId: string) => `user:${userId}`,
  session: (sessionId: string) => `session:${sessionId}`,
  admin: "platform:admins",
  tracking: (trackingTokenHash: string) => `tracking:${trackingTokenHash}`,
};
