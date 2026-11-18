import { describe, expect, it, vi } from "vitest";
import { enqueueRealtimeEvent } from "./realtime.service.js";

describe("realtime outbox", () => {
  it("persists one event row for each unique audience room", async () => {
    const values = vi.fn().mockResolvedValue([]);
    const transaction = { insert: vi.fn(() => ({ values })) };

    await enqueueRealtimeEvent(transaction as never, {
      rooms: ["tenant:tenant-1", "tracking:hash-1", "tenant:tenant-1"],
      type: "tracking.order-status.changed",
      payload: { orderNumber: "WD-0001", status: "Ready for Pickup" },
    });

    expect(transaction.insert).toHaveBeenCalledTimes(1);
    expect(values).toHaveBeenCalledWith([
      {
        room: "tenant:tenant-1",
        eventType: "tracking.order-status.changed",
        payload: { orderNumber: "WD-0001", status: "Ready for Pickup" },
      },
      {
        room: "tracking:hash-1",
        eventType: "tracking.order-status.changed",
        payload: { orderNumber: "WD-0001", status: "Ready for Pickup" },
      },
    ]);
  });

  it("does not write an event without an authorized audience", async () => {
    const transaction = { insert: vi.fn() };

    await enqueueRealtimeEvent(transaction as never, {
      rooms: [],
      type: "settings.changed",
      payload: {},
    });

    expect(transaction.insert).not.toHaveBeenCalled();
  });
});
