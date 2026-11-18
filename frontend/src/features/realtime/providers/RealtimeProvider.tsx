import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useLocation } from "react-router-dom";
import type { Socket } from "socket.io-client";
import { queryKeys } from "@/lib/queryKeys";
import { clearTokens, getAccessToken } from "@/features/auth/api/tokenStorage";
import { restoreAccessToken } from "@/services/apiClient";
import type { CurrentUser } from "@/features/auth/types/user";
import type {
  RealtimeConnectionStatus,
  RealtimeEvent,
} from "../realtime.types";

const cursorStorageKey = "neatwave-realtime-cursor";
const RealtimeStatusContext = createContext<RealtimeConnectionStatus>("idle");

export function RealtimeProvider({
  user,
  children,
}: {
  user: CurrentUser | undefined;
  children: ReactNode;
}) {
  const queryClient = useQueryClient();
  const location = useLocation();
  const [status, setStatus] = useState<RealtimeConnectionStatus>("idle");
  const trackingToken = useMemo(
    () => getTrackingToken(location.pathname),
    [location.pathname],
  );

  useEffect(() => {
    const hasPrivateSession = Boolean(user?.id && getAccessToken());
    if (!hasPrivateSession && !trackingToken) {
      setStatus("idle");
      return;
    }

    let hasConnectedBefore = false;
    let refreshingAccess = false;
    let socket: Socket | undefined;
    let isDisposed = false;

    const handleRealtimeEvent = (event: RealtimeEvent) => {
      saveCursor(event.id);
      if (event.type === "access.revoked") {
        clearTokens();
        queryClient.clear();
        window.dispatchEvent(new Event("neatwave:session-expired"));
        return;
      }
      void reconcileQueries(queryClient, event, trackingToken);
    };

    const handleResyncRequired = () => {
      void queryClient.invalidateQueries();
    };

    const handleReady = ({ cursor }: { cursor: number }) => {
      saveCursor(cursor);
    };

    const handleAuthRevoked = () => {
      clearTokens();
      queryClient.clear();
      window.dispatchEvent(new Event("neatwave:session-expired"));
    };

    const handleAuthRefreshRequired = () => {
      if (!user?.id) return;
      void restoreAccessToken().then((restored) => {
        if (!restored) {
          clearTokens();
          queryClient.clear();
          window.dispatchEvent(new Event("neatwave:session-expired"));
        }
      });
    };

    const handleConnect = () => {
      setStatus("connected");
      if (hasConnectedBefore) void queryClient.invalidateQueries();
      hasConnectedBefore = true;
    };

    const handleDisconnect = () => {
      setStatus(socket?.active ? "reconnecting" : "offline");
    };

    const handleConnectError = (error: Error) => {
      if (error.message !== "UNAUTHENTICATED") {
        setStatus(socket?.active ? "reconnecting" : "offline");
        return;
      }
      if (!user?.id || refreshingAccess) {
        setStatus("offline");
        return;
      }
      refreshingAccess = true;
      void restoreAccessToken()
        .then((restored) => {
          if (!restored) {
            clearTokens();
            queryClient.clear();
            window.dispatchEvent(new Event("neatwave:session-expired"));
            return;
          }
          socket?.connect();
        })
        .finally(() => {
          refreshingAccess = false;
        });
    };

    const handleAccessTokenChanged = () => {
      if (!getAccessToken()) {
        socket?.disconnect();
        if (trackingToken) {
          socket?.connect();
          setStatus("connecting");
        } else {
          setStatus("idle");
        }
        return;
      }
      if (!user?.id) return;
      socket?.disconnect();
      socket?.connect();
    };

    window.addEventListener(
      "neatwave:access-token-changed",
      handleAccessTokenChanged,
    );

    setStatus("connecting");
    void import("socket.io-client")
      .then(({ io }) => {
        if (isDisposed) return;
        socket = io(getSocketUrl(), {
          autoConnect: false,
          transports: ["websocket", "polling"],
          reconnection: true,
          auth: (sendAuth) => {
            sendAuth({
              accessToken: getAccessToken(),
              trackingToken,
              cursor: readCursor(),
            });
          },
        });
        socket.on("connect", handleConnect);
        socket.on("disconnect", handleDisconnect);
        socket.on("connect_error", handleConnectError);
        socket.on("realtime:event", handleRealtimeEvent);
        socket.on("realtime:resync-required", handleResyncRequired);
        socket.on("realtime:ready", handleReady);
        socket.on("realtime:auth-revoked", handleAuthRevoked);
        socket.on("realtime:auth-refresh-required", handleAuthRefreshRequired);
        socket.connect();
      })
      .catch(() => setStatus("offline"));

    return () => {
      isDisposed = true;
      window.removeEventListener(
        "neatwave:access-token-changed",
        handleAccessTokenChanged,
      );
      socket?.removeAllListeners();
      socket?.disconnect();
    };
  }, [queryClient, trackingToken, user?.id]);

  return (
    <RealtimeStatusContext.Provider value={status}>
      {children}
    </RealtimeStatusContext.Provider>
  );
}

export function useRealtimeConnectionStatus() {
  return useContext(RealtimeStatusContext);
}

async function reconcileQueries(
  queryClient: ReturnType<typeof useQueryClient>,
  event: RealtimeEvent,
  trackingToken?: string,
) {
  await Promise.all(
    getRealtimeQueryKeys(event, trackingToken).map((queryKey) =>
      queryClient.invalidateQueries({ queryKey }),
    ),
  );
}

export function getRealtimeQueryKeys(
  event: RealtimeEvent,
  trackingToken?: string,
) {
  const eventEntityId =
    readPayloadString(event.payload, "orderId") ??
    readPayloadString(event.payload, "customerId") ??
    readPayloadString(event.payload, "serviceId") ??
    readPayloadString(event.payload, "notificationId");
  const invalidations: (readonly unknown[])[] = [];
  const invalidate = (queryKey: readonly unknown[]) =>
    invalidations.push(queryKey);

  switch (event.type) {
    case "orders.changed":
      invalidate(["orders"]);
      invalidate(queryKeys.dashboard);
      invalidate(queryKeys.notifications);
      if (eventEntityId) invalidate(queryKeys.order(eventEntityId));
      if (typeof event.payload.customerId === "string")
        invalidate(queryKeys.customer(event.payload.customerId));
      break;
    case "tracking.order-status.changed":
      if (trackingToken) invalidate(queryKeys.tracking(trackingToken));
      break;
    case "customers.changed":
      invalidate(["customers"]);
      if (eventEntityId) invalidate(queryKeys.customer(eventEntityId));
      break;
    case "services.changed":
      invalidate(queryKeys.services);
      break;
    case "staff.changed":
      invalidate(queryKeys.staff);
      invalidate(queryKeys.currentUser);
      break;
    case "settings.changed":
      invalidate(queryKeys.settings);
      break;
    case "notifications.changed":
      invalidate(queryKeys.notifications);
      break;
    case "notifications.delivery.changed":
      invalidate(queryKeys.notificationDeliveries);
      break;
    case "platform.summary.changed":
      invalidate(queryKeys.adminSummary);
      if (typeof event.payload.tenantId === "string")
        invalidate(queryKeys.adminTenant(event.payload.tenantId));
      break;
    case "admin.tenants.changed":
      invalidate(["admin", "tenants"]);
      invalidate(queryKeys.adminSummary);
      if (typeof event.payload.tenantId === "string")
        invalidate(queryKeys.adminTenant(event.payload.tenantId));
      break;
    case "profile.changed":
      invalidate(queryKeys.currentUser);
      break;
    case "access.revoked":
      break;
  }
  return invalidations;
}

function getTrackingToken(pathname: string) {
  const trackingRouteMatch = pathname.match(/^\/track\/([^/]+)$/);
  if (!trackingRouteMatch) return undefined;
  try {
    return decodeURIComponent(trackingRouteMatch[1]);
  } catch {
    return trackingRouteMatch[1];
  }
}

function getSocketUrl() {
  const configuredSocketUrl = import.meta.env.VITE_SOCKET_URL as
    string | undefined;
  if (configuredSocketUrl) return configuredSocketUrl;
  const configuredApiUrl = import.meta.env.VITE_API_BASE_URL as
    string | undefined;
  if (configuredApiUrl?.startsWith("http"))
    return new URL(configuredApiUrl).origin;
  return import.meta.env.DEV ? "http://localhost:4000" : window.location.origin;
}

function readCursor() {
  const cursor = Number(sessionStorage.getItem(cursorStorageKey));
  return Number.isSafeInteger(cursor) && cursor > 0 ? cursor : 0;
}

function saveCursor(cursor: number) {
  if (!Number.isSafeInteger(cursor) || cursor <= 0) return;
  if (cursor > readCursor())
    sessionStorage.setItem(cursorStorageKey, String(cursor));
}

function readPayloadString(payload: Record<string, unknown>, key: string) {
  return typeof payload[key] === "string" ? payload[key] : undefined;
}
