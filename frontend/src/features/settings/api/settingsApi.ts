import { apiClient } from "@/services/apiClient";
import type { ApiResponse } from "@/types/api";
import type { BusinessSettings } from "../types/businessSettings";

export async function getSettings() {
  const response =
    await apiClient.get<ApiResponse<BusinessSettings>>("/settings");
  return response.data.data;
}

export async function updateSettings(input: Partial<BusinessSettings>) {
  const response = await apiClient.patch<ApiResponse<BusinessSettings>>(
    "/settings",
    input,
  );
  return response.data.data;
}
