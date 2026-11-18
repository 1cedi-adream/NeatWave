import { apiClient } from "@/services/apiClient";
import type { ApiResponse, PaginatedResponse } from "@/types/api";
import type { AdminSummary, Tenant, TenantDetail } from "../types/admin";

export type TenantFilters = {
  page: number;
  pageSize: number;
  search?: string;
  active?: "true" | "false";
};
export async function getSummary() {
  const response =
    await apiClient.get<ApiResponse<AdminSummary>>("/admin/summary");
  return response.data.data;
}
export async function getTenants(filters: TenantFilters) {
  const response = await apiClient.get<PaginatedResponse<Tenant>>(
    "/admin/tenants",
    { params: filters },
  );
  return response.data;
}
export async function getTenant(id: string) {
  const response = await apiClient.get<ApiResponse<TenantDetail>>(
    `/admin/tenants/${id}`,
  );
  return response.data.data;
}
export async function createTenant(input: {
  name: string;
  slug: string;
  managerEmail: string;
}) {
  const response = await apiClient.post<ApiResponse<Tenant>>(
    "/admin/tenants",
    input,
  );
  return response.data.data;
}
export async function updateTenantStatus(input: {
  id: string;
  active: boolean;
}) {
  const response = await apiClient.patch<ApiResponse<Tenant>>(
    `/admin/tenants/${input.id}/status`,
    { active: input.active },
  );
  return response.data.data;
}

export async function resendManagerInvitation(id: string) {
  const response = await apiClient.post<
    ApiResponse<{ email: string; delivery: "queued"; invitationUrl?: string }>
  >(`/admin/tenants/${id}/resend-invitation`);
  return response.data.data;
}
