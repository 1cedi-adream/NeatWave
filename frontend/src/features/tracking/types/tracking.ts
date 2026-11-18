import type { OrderStatus } from "@/constants/orderStatuses";
export type TrackingDetails = {
  orderNumber: string;
  status: OrderStatus;
  dueAt: string;
  createdAt: string;
  business?: { businessName: string; phone: string; email: string };
  lines: { serviceName: string; quantity?: string; basketName?: string }[];
  history: { status: OrderStatus; createdAt: string }[];
};
