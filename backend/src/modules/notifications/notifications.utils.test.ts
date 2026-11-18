import { describe, expect, it } from "vitest";
import { renderStatusMessage } from "./notifications.utils.js";

describe("notification templates", () => {
  it("includes the laundry name, current order status, and public tracking link", () => {
    const message = renderStatusMessage(
      {
        businessName: "John Mart",
        orderNumber: "WD-0001",
        status: "Ready for Pickup",
        trackingUrl: "http://localhost:5174/track/opaque-token",
      },
      "order-status",
    );
    expect(message.subject).toBe(
      "Your order from John Mart is Ready for Pickup",
    );
    expect(message.text).toContain(
      "WD-0001 from John Mart is Ready for Pickup",
    );
    expect(message.text).toContain("http://localhost:5174/track/opaque-token");
    expect(message.text).toContain("track its status");
  });

  it("renders an invitation without exposing anything except the opaque link", () => {
    const message = renderStatusMessage(
      {
        businessName: "Fresh Fold",
        invitationUrl: "https://app.example/accept-invite/opaque",
      },
      "staff_invitation",
    );
    expect(message.subject).toContain("Fresh Fold");
    expect(message.text).toContain("/accept-invite/opaque");
  });
});
