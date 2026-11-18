import { Wifi, WifiOff } from "lucide-react";
import { useRealtimeConnectionStatus } from "../providers/RealtimeProvider";

const statusLabels = {
  idle: "",
  connecting: "Connecting",
  connected: "Live updates",
  reconnecting: "Reconnecting",
  offline: "Live updates unavailable",
} as const;

export function RealtimeConnectionBadge() {
  const status = useRealtimeConnectionStatus();
  if (status === "idle") return null;

  const isConnected = status === "connected";

  return (
    <span
      className={`realtime-connection ${isConnected ? "is-connected" : "is-disconnected"}`}
      role="status"
      aria-live="polite"
    >
      {isConnected ? <Wifi size={14} /> : <WifiOff size={14} />}
      {statusLabels[status]}
    </span>
  );
}
