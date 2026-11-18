import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import * as adminApi from "../api/adminApi";

export function useAdminSummary() {
  return useQuery({
    queryKey: queryKeys.adminSummary,
    queryFn: adminApi.getSummary,
  });
}
export function useTenants(filters: adminApi.TenantFilters) {
  return useQuery({
    queryKey: queryKeys.adminTenants(filters),
    queryFn: () => adminApi.getTenants(filters),
    placeholderData: (previous) => previous,
  });
}
export function useTenant(id: string) {
  return useQuery({
    queryKey: queryKeys.adminTenant(id),
    queryFn: () => adminApi.getTenant(id),
    enabled: Boolean(id),
  });
}
export function useCreateTenant() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: adminApi.createTenant,
    onSuccess: () =>
      Promise.all([
        client.invalidateQueries({ queryKey: ["admin", "tenants"] }),
        client.invalidateQueries({ queryKey: queryKeys.adminSummary }),
      ]),
  });
}
export function useUpdateTenantStatus() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: adminApi.updateTenantStatus,
    onSuccess: (_, input) =>
      Promise.all([
        client.invalidateQueries({ queryKey: ["admin", "tenants"] }),
        client.invalidateQueries({ queryKey: queryKeys.adminTenant(input.id) }),
        client.invalidateQueries({ queryKey: queryKeys.adminSummary }),
      ]),
  });
}

export function useResendManagerInvitation() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: adminApi.resendManagerInvitation,
    onSuccess: (_, tenantId) =>
      Promise.all([
        client.invalidateQueries({ queryKey: queryKeys.adminTenant(tenantId) }),
        client.invalidateQueries({ queryKey: ["admin", "tenants"] }),
      ]),
  });
}
