import type { PropsWithChildren } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useCreateOrder } from "./useOrders";
import * as ordersApi from "../api/ordersApi";

vi.mock("../api/ordersApi", () => ({
  createOrder: vi.fn(),
  getOrders: vi.fn(),
  getOrder: vi.fn(),
  updateOrderStatus: vi.fn(),
}));

describe("useCreateOrder", () => {
  beforeEach(() => vi.clearAllMocks());

  it("invalidates orders, dashboard, notifications, and customer history", async () => {
    vi.mocked(ordersApi.createOrder).mockResolvedValue({
      id: "order-1",
    } as never);
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    const invalidate = vi.spyOn(queryClient, "invalidateQueries");
    const wrapper = ({ children }: PropsWithChildren) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
    const { result } = renderHook(() => useCreateOrder(), { wrapper });
    await act(async () => {
      await result.current.mutateAsync({
        customerId: "customer-1",
        discountPesewas: 0,
        lines: [{ serviceId: "service-1", quantity: 2 }],
      });
    });
    await waitFor(() => expect(invalidate).toHaveBeenCalledTimes(4));
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["orders"] });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["dashboard"] });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["notifications"] });
    expect(invalidate).toHaveBeenCalledWith({
      queryKey: ["customers", "customer-1"],
    });
  });
});
