import { describe, expect, it, vi } from "vitest";
import { MnotifyProvider } from "./notifications.service.js";

describe("mNotify provider", () => {
  it("returns the campaign identifier from the documented summary", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(
        JSON.stringify({
          status: "success",
          summary: { _id: "campaign-123", total_rejected: 0 },
        }),
        { status: 200 },
      ),
    );
    const provider = new MnotifyProvider(fetcher, "test-key");

    await expect(
      provider.send({ recipient: "0241234567", subject: "", text: "Ready" }),
    ).resolves.toBe("campaign-123");
    expect(fetcher).toHaveBeenCalledWith(
      expect.any(URL),
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
  });

  it("rejects unsuccessful and malformed provider responses", async () => {
    const rejectedProvider = new MnotifyProvider(
      vi.fn<typeof fetch>().mockResolvedValue(
        new Response(JSON.stringify({ status: "error", code: "4001" }), {
          status: 200,
        }),
      ),
      "test-key",
    );
    const malformedProvider = new MnotifyProvider(
      vi.fn<typeof fetch>().mockResolvedValue(new Response("not-json")),
      "test-key",
    );

    await expect(
      rejectedProvider.send({
        recipient: "0241234567",
        subject: "",
        text: "Ready",
      }),
    ).rejects.toThrow("mNotify rejected the message (4001)");
    await expect(
      malformedProvider.send({
        recipient: "0241234567",
        subject: "",
        text: "Ready",
      }),
    ).rejects.toThrow("mNotify returned invalid JSON");
  });
});
