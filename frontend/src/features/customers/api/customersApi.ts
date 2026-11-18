import { apiClient } from "@/services/apiClient";
import type { ApiResponse, PaginatedResponse } from "@/types/api";
import type {
  Customer,
  CustomerDetail,
  CustomerInput,
} from "../types/customer";

export type CustomerFilters = {
  page: number;
  pageSize: number;
  search?: string;
};

export async function getCustomers(filters: CustomerFilters) {
  const response = await apiClient.get<PaginatedResponse<Customer>>(
    "/customers",
    { params: filters },
  );
  return response.data;
}

export async function getCustomer(id: string) {
  const response = await apiClient.get<ApiResponse<CustomerDetail>>(
    `/customers/${id}`,
  );
  return response.data.data;
}

export async function createCustomer(input: CustomerInput) {
  const response = await apiClient.post<ApiResponse<Customer>>(
    "/customers",
    input,
  );
  return response.data.data;
}

export async function updateCustomer({
  id,
  ...input
}: Partial<CustomerInput> & { id: string }) {
  const response = await apiClient.patch<ApiResponse<Customer>>(
    `/customers/${id}`,
    input,
  );
  return response.data.data;
}
