import type { Server as HttpServer } from "node:http";
import jwt from "jsonwebtoken";
import { and, eq, gt, isNull } from "drizzle-orm";
import { Server, type Socket } from "socket.io";
import { env } from "@/config/env.js";
import { db } from "@/db/index.js";
import {
  orders,
  refreshTokens,
  tenantMemberships,
  tenants,
  users,
} from "@/db/schema/index.js";
import { AppError } from "@/utils/errors.js";
import { hashToken } from "@/utils/token.utils.js";
import { logger } from "@/utils/logger.js";
import {
  claimRealtimeEvents,
  countPendingRealtimeEvents,
  cursorIsTooOld,
  getEventsAfterCursor,
  getRealtimeCursor,
  markRealtimeEventPublished,
  pruneRealtimeEvents,
  releaseRealtimeEvent,
} from "./realtime.service.js";
import {
  realtimeRooms,
  type RealtimeEvent,
  type RealtimeEventType,
} from "./realtime.types.js";

type ClientToServerEvents = Record<string, never>;
type ServerToClientEvents = {
  "realtime:event": (event: RealtimeEvent) => void;
  "realtime:resync-required": () => void;
  "realtime:auth-revoked": () => void;
  "realtime:auth-refresh-required": () => void;
  "realtime:ready": (message: { cursor: number }) => void;
};
type InterServerEvents = Record<string, never>;
type SocketData = {
  rooms: string[];
  userId?: string;
  sessionId?: string;
  tenantId?: string;
  isSuperAdmin: boolean;
  accessExpiresAt?: number;
  expirationTimer?: NodeJS.Timeout;
};
type RealtimeServer = Server<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>;
type RealtimeSocket = Socket<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>;
type AccessClaims = { sub: string; sid?: string; type: "access"; exp?: number };

let realtimeServer: RealtimeServer | null = null;
let publisherRunning = false;
let publisherState: "starting" | "ready" | "degraded" = "starting";
let lastPublishedAt: string | null = null;
let lastPublisherError: string | null = null;
let lastPrunedAt = 0;

export function attachRealtimeGateway(httpServer: HttpServer) {
  const allowedOrigins = (env.SOCKET_ALLOWED_ORIGINS || env.FRONTEND_URL)
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  realtimeServer = new Server<
    ClientToServerEvents,
    ServerToClientEvents,
    InterServerEvents,
    SocketData
  >(httpServer, {
    cors: { origin: allowedOrigins },
    transports: ["websocket", "polling"],
    allowRequest: (request, callback) => {
      const origin = request.headers.origin;
      callback(null, !origin || allowedOrigins.includes(origin));
    },
  });

  realtimeServer.use(authenticateSocket);
  realtimeServer.on("connection", (socket) => {
    void handleSocketConnection(socket);
  });
  void publishOutboxContinuously();

  return realtimeServer;
}

export async function getRealtimeHealth() {
  let pendingEvents = 0;
  try {
    pendingEvents = await countPendingRealtimeEvents();
  } catch {
    publisherState = "degraded";
  }
  if (pendingEvents > 1000 && publisherState === "ready")
    publisherState = "degraded";
  return {
    status: publisherState,
    pendingEvents,
    lastPublishedAt,
    lastPublisherError,
  };
}

async function authenticateSocket(
  socket: RealtimeSocket,
  next: (error?: Error) => void,
) {
  try {
    const handshake = socket.handshake.auth as {
      accessToken?: unknown;
      trackingToken?: unknown;
    };
    const rooms: string[] = [];
    let socketData: SocketData = { rooms, isSuperAdmin: false };

    if (typeof handshake.accessToken === "string") {
      const claims = jwt.verify(
        handshake.accessToken,
        env.JWT_ACCESS_SECRET,
      ) as AccessClaims;
      if (claims.type !== "access" || !claims.sub)
        throw new AppError(
          401,
          "UNAUTHENTICATED",
          "Socket access is required.",
        );

      if (claims.sid) {
        const [session] = await db
          .select({ id: refreshTokens.id })
          .from(refreshTokens)
          .where(
            and(
              eq(refreshTokens.familyId, claims.sid),
              eq(refreshTokens.userId, claims.sub),
              isNull(refreshTokens.revokedAt),
              gt(refreshTokens.expiresAt, new Date()),
            ),
          )
          .limit(1);
        if (!session)
          throw new AppError(
            401,
            "UNAUTHENTICATED",
            "Socket access is required.",
          );
      }

      const [user] = await db
        .select({ id: users.id, platformRole: users.platformRole })
        .from(users)
        .where(and(eq(users.id, claims.sub), eq(users.active, true)))
        .limit(1);
      if (!user)
        throw new AppError(
          401,
          "UNAUTHENTICATED",
          "Socket access is required.",
        );

      rooms.push(realtimeRooms.user(user.id));
      socketData.userId = user.id;
      if (claims.sid) {
        socketData.sessionId = claims.sid;
        rooms.push(realtimeRooms.session(claims.sid));
      }
      socketData.isSuperAdmin = user.platformRole === "super_admin";
      if (socketData.isSuperAdmin) {
        rooms.push(realtimeRooms.admin);
      } else {
        const [membership] = await db
          .select({ tenantId: tenantMemberships.tenantId })
          .from(tenantMemberships)
          .innerJoin(
            tenants,
            and(
              eq(tenants.id, tenantMemberships.tenantId),
              eq(tenants.active, true),
            ),
          )
          .where(
            and(
              eq(tenantMemberships.userId, user.id),
              eq(tenantMemberships.active, true),
            ),
          )
          .limit(1);
        if (!membership)
          throw new AppError(
            401,
            "UNAUTHENTICATED",
            "Tenant access is unavailable.",
          );
        socketData.tenantId = membership.tenantId;
        rooms.push(realtimeRooms.tenant(membership.tenantId));
      }
      socketData.accessExpiresAt = claims.exp ? claims.exp * 1000 : undefined;
    }

    if (typeof handshake.trackingToken === "string") {
      const tokenHash = hashToken(handshake.trackingToken);
      const [trackedOrder] = await db
        .select({ id: orders.id })
        .from(orders)
        .where(eq(orders.trackingTokenHash, tokenHash))
        .limit(1);
      if (!trackedOrder)
        throw new AppError(
          401,
          "INVALID_TRACKING_LINK",
          "Tracking link is unavailable.",
        );
      rooms.push(realtimeRooms.tracking(tokenHash));
    }

    if (!rooms.length)
      throw new AppError(401, "UNAUTHENTICATED", "Socket access is required.");

    socketData.rooms = [...new Set(rooms)];
    socket.data = socketData;
    next();
  } catch (error) {
    const message =
      error instanceof AppError && error.code === "INVALID_TRACKING_LINK"
        ? "INVALID_TRACKING_LINK"
        : "UNAUTHENTICATED";
    logger.warn(
      { reason: message, origin: socket.handshake.headers.origin },
      "Socket connection rejected",
    );
    next(new Error(message));
  }
}

async function handleSocketConnection(socket: RealtimeSocket) {
  await socket.join(socket.data.rooms);
  setTokenExpiry(socket);
  logger.info(
    {
      userId: socket.data.userId,
      tenantId: socket.data.tenantId,
      isSuperAdmin: socket.data.isSuperAdmin,
      includesPublicTracking: socket.data.rooms.some((room) =>
        room.startsWith("tracking:"),
      ),
    },
    "Realtime client connected",
  );
  await replayMissedEvents(socket);
  socket.on("disconnect", () => {
    if (socket.data.expirationTimer) clearTimeout(socket.data.expirationTimer);
    logger.info(
      { userId: socket.data.userId, tenantId: socket.data.tenantId },
      "Realtime client disconnected",
    );
  });
}

function setTokenExpiry(socket: RealtimeSocket) {
  const expiry = socket.data.accessExpiresAt;
  if (!expiry) return;
  const remainingMs = expiry - Date.now();
  if (remainingMs <= 0) {
    socket.emit("realtime:auth-revoked");
    socket.disconnect(true);
    return;
  }
  socket.data.expirationTimer = setTimeout(
    () => {
      socket.emit("realtime:auth-refresh-required");
    },
    Math.min(Math.max(remainingMs - 30_000, 1000), 2_147_000_000),
  );
  socket.data.expirationTimer.unref();
}

async function replayMissedEvents(socket: RealtimeSocket) {
  const handshake = socket.handshake.auth as { cursor?: unknown };
  const cursor =
    typeof handshake.cursor === "number" &&
    Number.isSafeInteger(handshake.cursor) &&
    handshake.cursor >= 0
      ? handshake.cursor
      : 0;
  const highWaterMark = await getRealtimeCursor();

  if (cursor === 0 || (await cursorIsTooOld(cursor))) {
    socket.emit("realtime:resync-required");
    socket.emit("realtime:ready", { cursor: highWaterMark });
    return;
  }

  const missedEvents = await getEventsAfterCursor(
    socket.data.rooms,
    cursor,
    highWaterMark,
  );
  if (missedEvents.length > 1000) {
    socket.emit("realtime:resync-required");
    socket.emit("realtime:ready", { cursor: highWaterMark });
    return;
  }

  for (const event of missedEvents) {
    socket.emit("realtime:event", {
      id: event.id,
      type: event.eventType as RealtimeEventType,
      payload: event.payload,
      createdAt: event.createdAt.toISOString(),
    });
  }
  socket.emit("realtime:ready", { cursor: highWaterMark });
}

async function publishOutboxContinuously() {
  if (publisherRunning) return;
  publisherRunning = true;
  publisherState = "ready";

  while (realtimeServer) {
    try {
      await pruneExpiredEvents();
      const events = await claimRealtimeEvents();
      if (events.length === 0) {
        publisherState = "ready";
        lastPublisherError = null;
        await delay(250);
        continue;
      }

      for (const event of events) {
        try {
          const realtimeEvent: RealtimeEvent = {
            id: event.id,
            type: event.eventType as RealtimeEventType,
            payload: event.payload,
            createdAt: event.createdAt.toISOString(),
          };
          realtimeServer.to(event.room).emit("realtime:event", realtimeEvent);
          logger.debug(
            { eventId: event.id, eventType: realtimeEvent.type },
            "Realtime event published",
          );
          if (realtimeEvent.type === "access.revoked") {
            realtimeServer.to(event.room).emit("realtime:auth-revoked");
            setTimeout(
              () => realtimeServer?.in(event.room).disconnectSockets(true),
              100,
            ).unref();
          }
          await markRealtimeEventPublished(event.id);
          lastPublishedAt = new Date().toISOString();
          lastPublisherError = null;
          publisherState = "ready";
        } catch (error) {
          await releaseRealtimeEvent(event.id, error);
          logger.error(
            {
              eventId: event.id,
              eventType: event.eventType,
              error: error instanceof Error ? error.message : "Publish failed",
            },
            "Realtime event publish failed",
          );
          throw error;
        }
      }
    } catch (error) {
      publisherState = "degraded";
      lastPublisherError =
        error instanceof Error ? error.message.slice(0, 200) : "Publish failed";
      await delay(1000);
    }
  }
  publisherRunning = false;
}

async function pruneExpiredEvents() {
  const retentionStart = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  if (Date.now() - lastPrunedAt < 60 * 60 * 1000) return;
  await pruneRealtimeEvents(retentionStart);
  lastPrunedAt = Date.now();
}

function delay(durationMs: number) {
  return new Promise((resolve) => setTimeout(resolve, durationMs));
}
