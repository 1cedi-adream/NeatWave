import { apiClient } from "@/services/apiClient";
import type { ApiResponse } from "@/types/api";
import type { TrackingDetails } from "../types/tracking";

export async function getTracking(token: string) {
  const response = await apiClient.get<ApiResponse<TrackingDetails>>(
    `/public/tracking/${token}`,
  );
  return response.data.data;
}
