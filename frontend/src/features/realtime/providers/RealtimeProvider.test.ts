import { describe, expect, it } from "vitest";
import { queryKeys } from "@/lib/queryKeys";
import { getRealtimeQueryKeys } from "./RealtimeProvider";
import type { RealtimeEvent } from "../realtime.types";

function event(
  type: RealtimeEvent["type"],
  payload: Record<string, unknown> = {},
): RealtimeEvent {
  return { id: 1, type, payload, createdAt: "2026-11-18T12:00:00.000Z" };
}

describe("realtime query reconciliation", () => {
  it("refreshes order views affected by status and payment changes", () => {
    expect(
      getRealtimeQueryKeys(
        event("orders.changed", {
          orderId: "order-1",
          customerId: "customer-1",
        }),
      ),
    ).toEqual([
      ["orders"],
      queryKeys.dashboard,
      queryKeys.notifications,
      queryKeys.order("order-1"),
      queryKeys.customer("customer-1"),
    ]);
  });

  it("refreshes only the public tracking query for tracking status changes", () => {
    expect(
      getRealtimeQueryKeys(
        event("tracking.order-status.changed", { status: "Washing" }),
        "opaque-token",
      ),
    ).toEqual([queryKeys.tracking("opaque-token")]);
  });

  it("separates in-app notification changes from provider delivery changes", () => {
    expect(getRealtimeQueryKeys(event("notifications.changed"))).toEqual([
      queryKeys.notifications,
    ]);
    expect(
      getRealtimeQueryKeys(event("notifications.delivery.changed")),
    ).toEqual([queryKeys.notificationDeliveries]);
  });

  it("refreshes superadmin summaries and the affected tenant detail", () => {
    expect(
      getRealtimeQueryKeys(
        event("platform.summary.changed", { tenantId: "tenant-1" }),
      ),
    ).toEqual([queryKeys.adminSummary, queryKeys.adminTenant("tenant-1")]);
  });
});
