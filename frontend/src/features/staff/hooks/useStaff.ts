import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import * as api from "../api/staffApi";

export function useStaff() {
  return useQuery({ queryKey: queryKeys.staff, queryFn: api.getStaff });
}

export function useInviteStaff() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: api.inviteStaff,
    onSuccess: () => client.invalidateQueries({ queryKey: queryKeys.staff }),
  });
}

export function useUpdateStaff() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: api.updateStaff,
    onSuccess: () => client.invalidateQueries({ queryKey: queryKeys.staff }),
  });
}
