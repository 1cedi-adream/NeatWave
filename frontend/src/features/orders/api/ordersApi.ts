import { apiClient } from "@/services/apiClient";
import type { ApiResponse, PaginatedResponse } from "@/types/api";

import type {
  CreateOrderInput,
  CreatedOrder,
  OrderDetail,
  OrderListItem,
  OrderStatus,
} from "../types/order";

export type OrderFilters = {
  page: number;
  pageSize: number;
  search?: string;
  status?: OrderStatus;
};

export async function getOrders(filters: OrderFilters) {
  const response = await apiClient.get<PaginatedResponse<OrderListItem>>(
    "/orders",
    { params: filters },
  );
  return response.data;
}

export async function exportOrders(period: string) {
  const response = await apiClient.get<ApiResponse<OrderListItem[]>>(
    "/orders/export",
    { params: { period } },
  );
  return response.data.data;
}

export async function getOrder(id: string) {
  const response = await apiClient.get<ApiResponse<OrderDetail>>(
    `/orders/${id}`,
  );
  return response.data.data;
}

export async function downloadOrderReceipt(id: string) {
  const response = await apiClient.get<Blob>(`/orders/${id}/receipt.pdf`, {
    responseType: "blob",
  });
  return response.data;
}

export async function createOrder(input: CreateOrderInput) {
  const response = await apiClient.post<ApiResponse<CreatedOrder>>(
    "/orders",
    input,
  );
  return response.data.data;
}

export async function updateOrderStatus({
  id,
  status,
}: {
  id: string;
  status: OrderStatus;
}) {
  await apiClient.post(`/orders/${id}/status`, { status });
}
