import type { OrderStatus } from "../../../constants/orderStatuses";
export type { OrderStatus } from "../../../constants/orderStatuses";

export type OrderRecord = {
  id: string;
  tenantId: string;
  customerId: string;
  orderNumber: string;
  status: OrderStatus;
  dueAt: string;
  subtotalPesewas: number;
  discountPesewas: number;
  taxPesewas: number;
  totalPesewas: number;
  notes?: string;
  createdAt: string;
};

export type OrderListItem = {
  order: OrderRecord;
  customerName: string;
  customerPhone: string;
};

export type OrderLine = {
  id: string;
  serviceName: string;
  pricingModel: string;
  quantity?: string;
  basketName?: string;
  lineTotalPesewas: number;
};

export type OrderDetail = OrderRecord & {
  customer: {
    id: string;
    fullName: string;
    phone: string;
    email?: string;
    address: string;
  };
  lines: OrderLine[];
  statusHistory: { toStatus: OrderStatus; createdAt: string }[];
  payments: unknown[];
  receipt: { receiptNumber: string; snapshot: Record<string, unknown> } | null;
  paidPesewas: number;
  refundedPesewas: number;
  netPaidPesewas: number;
  balancePesewas: number;
  trackingUrl: string | null;
};

export type CreateOrderInput = {
  customerId: string;
  dueAt?: string;
  discountPesewas: number;
  taxBasisPoints?: number;
  notes?: string;
  lines: { serviceId: string; quantity?: number; basketOptionId?: string }[];
};

export type CreatedOrder = OrderRecord & {
  trackingToken: string;
  trackingUrl: string;
};

export type Order = OrderListItem;

export type Receipt = {
  id: string;
  name: string;
  phone: string;
  items: string;
  amount: string;
  payment: string;
};
