export type RealtimeConnectionStatus =
  "idle" | "connecting" | "connected" | "reconnecting" | "offline";

export type RealtimeEvent = {
  id: number;
  type:
    | "orders.changed"
    | "tracking.order-status.changed"
    | "customers.changed"
    | "services.changed"
    | "staff.changed"
    | "settings.changed"
    | "notifications.changed"
    | "notifications.delivery.changed"
    | "platform.summary.changed"
    | "admin.tenants.changed"
    | "profile.changed"
    | "access.revoked";
  payload: Record<string, unknown>;
  createdAt: string;
};
