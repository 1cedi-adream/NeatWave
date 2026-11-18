import { apiClient } from "@/services/apiClient";
import type { ApiResponse } from "@/types/api";
import type { DashboardSummary } from "../types/dashboard";

export async function getDashboard() {
  const response =
    await apiClient.get<ApiResponse<DashboardSummary>>("/dashboard");
  return response.data.data;
}
