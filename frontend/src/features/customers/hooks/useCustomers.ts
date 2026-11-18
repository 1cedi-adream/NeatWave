import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import * as api from "../api/customersApi";

export function useCustomers(filters: api.CustomerFilters) {
  return useQuery({
    queryKey: queryKeys.customers(filters),
    queryFn: () => api.getCustomers(filters),
    placeholderData: (previous) => previous,
  });
}

export function useCustomer(id: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.customer(id),
    queryFn: () => api.getCustomer(id),
    enabled: Boolean(id) && enabled,
  });
}

export function useCreateCustomer() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: api.createCustomer,
    onSuccess: () => client.invalidateQueries({ queryKey: ["customers"] }),
  });
}

export function useUpdateCustomer() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: api.updateCustomer,
    onSuccess: () => client.invalidateQueries({ queryKey: ["customers"] }),
  });
}
