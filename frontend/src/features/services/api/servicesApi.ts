import { apiClient } from "@/services/apiClient";
import type { ApiResponse } from "@/types/api";
import type { LaundryService, ServiceInput } from "../types/laundryService";

export async function getServices() {
  const response =
    await apiClient.get<ApiResponse<LaundryService[]>>("/services");
  return response.data.data;
}

export async function createService(input: ServiceInput) {
  const response = await apiClient.post<ApiResponse<LaundryService>>(
    "/services",
    input,
  );
  return response.data.data;
}

export async function updateService({
  id,
  ...input
}: { id: string } & Partial<ServiceInput>) {
  const response = await apiClient.patch<ApiResponse<LaundryService>>(
    `/services/${id}`,
    input,
  );
  return response.data.data;
}
