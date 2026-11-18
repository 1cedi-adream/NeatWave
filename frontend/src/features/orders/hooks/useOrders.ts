import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import * as api from "../api/ordersApi";

export function useOrders(filters: api.OrderFilters) {
  return useQuery({
    queryKey: queryKeys.orders(filters),
    queryFn: () => api.getOrders(filters),
    placeholderData: (previous) => previous,
  });
}

export function useOrder(id: string) {
  return useQuery({
    queryKey: queryKeys.order(id),
    queryFn: () => api.getOrder(id),
    enabled: Boolean(id),
  });
}

export function useCreateOrder() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: api.createOrder,
    onSuccess: (_, input) =>
      Promise.all([
        client.invalidateQueries({ queryKey: ["orders"] }),
        client.invalidateQueries({ queryKey: queryKeys.dashboard }),
        client.invalidateQueries({ queryKey: queryKeys.notifications }),
        client.invalidateQueries({
          queryKey: queryKeys.customer(input.customerId),
        }),
      ]),
  });
}

export function useUpdateOrderStatus() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: api.updateOrderStatus,
    onSuccess: (_, input) =>
      Promise.all([
        client.invalidateQueries({ queryKey: ["orders"] }),
        client.invalidateQueries({ queryKey: queryKeys.order(input.id) }),
        client.invalidateQueries({ queryKey: queryKeys.dashboard }),
        client.invalidateQueries({ queryKey: queryKeys.notifications }),
      ]),
  });
}
