import type { OrderRecord, OrderStatus } from "@/features/orders/types/order";

export type DashboardSummary = {
  totalOrders: number;
  totalOrderValuePesewas: number;
  ordersByStatus: { status: OrderStatus; value: number }[];
  customerCount: number;
  readyOrders: OrderRecord[];
};
