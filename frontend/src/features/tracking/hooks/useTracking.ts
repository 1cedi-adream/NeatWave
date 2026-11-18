import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { getTracking } from "../api/trackingApi";
import { useRealtimeConnectionStatus } from "@/features/realtime/providers/RealtimeProvider";

export function useTracking(token: string) {
  const connectionStatus = useRealtimeConnectionStatus();
  return useQuery({
    queryKey: queryKeys.tracking(token),
    queryFn: () => getTracking(token),
    enabled: Boolean(token),
    retry: false,
    refetchInterval: connectionStatus === "connected" ? false : 15_000,
  });
}
