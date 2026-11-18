import { apiClient } from "@/services/apiClient";
import type { ApiResponse } from "@/types/api";
import type { Notification, NotificationDelivery } from "../types/notification";

export async function getNotifications() {
  const response =
    await apiClient.get<ApiResponse<Notification[]>>("/notifications");
  return response.data.data;
}

export async function getNotificationDeliveries() {
  const response = await apiClient.get<ApiResponse<NotificationDelivery[]>>(
    "/notifications/deliveries/jobs",
  );
  return response.data.data;
}

export async function retryNotificationDelivery(jobId: string) {
  const response = await apiClient.post<ApiResponse<NotificationDelivery>>(
    `/notifications/deliveries/${jobId}/retry`,
  );
  return response.data.data;
}

export async function markRead(id: string) {
  await apiClient.post(`/notifications/${id}/read`);
}

export async function markAllRead() {
  await apiClient.post("/notifications/read-all");
}
