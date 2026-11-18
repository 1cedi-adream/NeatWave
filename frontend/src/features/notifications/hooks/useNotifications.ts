import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import * as api from "../api/notificationsApi";

export function useNotifications() {
  return useQuery({
    queryKey: queryKeys.notifications,
    queryFn: api.getNotifications,
  });
}

export function useNotificationDeliveries(enabled = true) {
  return useQuery({
    queryKey: queryKeys.notificationDeliveries,
    queryFn: api.getNotificationDeliveries,
    enabled,
  });
}

export function useRetryNotificationDelivery() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: api.retryNotificationDelivery,
    onSuccess: () =>
      Promise.all([
        client.invalidateQueries({
          queryKey: queryKeys.notificationDeliveries,
        }),
        client.invalidateQueries({ queryKey: queryKeys.notifications }),
      ]),
  });
}

export function useMarkNotificationRead() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: api.markRead,
    onSuccess: () =>
      client.invalidateQueries({ queryKey: queryKeys.notifications }),
  });
}

export function useMarkAllNotificationsRead() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: api.markAllRead,
    onSuccess: () =>
      client.invalidateQueries({ queryKey: queryKeys.notifications }),
  });
}
