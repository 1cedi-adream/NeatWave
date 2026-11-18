import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import * as api from "../api/servicesApi";

export function useServices() {
  return useQuery({ queryKey: queryKeys.services, queryFn: api.getServices });
}

export function useCreateService() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: api.createService,
    onSuccess: () => client.invalidateQueries({ queryKey: queryKeys.services }),
  });
}

export function useUpdateService() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: api.updateService,
    onSuccess: () => client.invalidateQueries({ queryKey: queryKeys.services }),
  });
}
