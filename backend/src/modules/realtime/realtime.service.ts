import {
  and,
  asc,
  count,
  eq,
  gt,
  inArray,
  isNull,
  lt,
  lte,
  max,
  or,
  sql,
} from "drizzle-orm";
import { db, type Database } from "@/db/index.js";
import { realtimeEvents } from "@/db/schema/index.js";
import type { RealtimeEventType } from "./realtime.types.js";

type RealtimeTransaction = Parameters<
  Parameters<Database["transaction"]>[0]
>[0];

export type RealtimeOutboxInput = {
  rooms: string[];
  type: RealtimeEventType;
  payload: Record<string, unknown>;
};

export async function enqueueRealtimeEvent(
  transaction: RealtimeTransaction,
  input: RealtimeOutboxInput,
) {
  const uniqueRooms = [...new Set(input.rooms)];
  if (uniqueRooms.length === 0) return;

  await transaction.insert(realtimeEvents).values(
    uniqueRooms.map((room) => ({
      room,
      eventType: input.type,
      payload: input.payload,
    })),
  );
}

export async function getRealtimeCursor() {
  const [cursor] = await db
    .select({ value: max(realtimeEvents.id) })
    .from(realtimeEvents);
  return Number(cursor?.value ?? 0);
}

export async function getEventsAfterCursor(
  rooms: string[],
  cursor: number,
  highWaterMark: number,
) {
  if (!rooms.length || cursor >= highWaterMark) return [];

  return db
    .select()
    .from(realtimeEvents)
    .where(
      and(
        inArray(realtimeEvents.room, rooms),
        gt(realtimeEvents.id, cursor),
        lte(realtimeEvents.id, highWaterMark),
      ),
    )
    .orderBy(asc(realtimeEvents.id))
    .limit(1001);
}

export async function claimRealtimeEvents(batchSize = 100) {
  return db.transaction(async (transaction) => {
    const now = new Date();
    const claimedEvents = await transaction
      .select()
      .from(realtimeEvents)
      .where(
        and(
          isNull(realtimeEvents.publishedAt),
          or(
            isNull(realtimeEvents.lockedAt),
            lt(realtimeEvents.lockedAt, new Date(now.getTime() - 30_000)),
          ),
        ),
      )
      .orderBy(asc(realtimeEvents.id))
      .limit(batchSize)
      .for("update", { skipLocked: true });

    if (!claimedEvents.length) return [];

    return transaction
      .update(realtimeEvents)
      .set({ lockedAt: now, attempts: sql`${realtimeEvents.attempts}+1` })
      .where(
        inArray(
          realtimeEvents.id,
          claimedEvents.map((event) => event.id),
        ),
      )
      .returning();
  });
}

export async function markRealtimeEventPublished(eventId: number) {
  await db
    .update(realtimeEvents)
    .set({ publishedAt: new Date(), lockedAt: null, lastError: null })
    .where(eq(realtimeEvents.id, eventId));
}

export async function releaseRealtimeEvent(eventId: number, error: unknown) {
  await db
    .update(realtimeEvents)
    .set({
      lockedAt: null,
      lastError:
        error instanceof Error ? error.message.slice(0, 500) : "Publish failed",
    })
    .where(eq(realtimeEvents.id, eventId));
}

export async function countPendingRealtimeEvents() {
  const [result] = await db
    .select({ value: count() })
    .from(realtimeEvents)
    .where(isNull(realtimeEvents.publishedAt));
  return result?.value ?? 0;
}

export async function pruneRealtimeEvents(retentionStart: Date) {
  await db
    .delete(realtimeEvents)
    .where(
      and(
        lt(realtimeEvents.createdAt, retentionStart),
        sql`${realtimeEvents.publishedAt} is not null`,
      ),
    );
}

export async function cursorIsTooOld(cursor: number) {
  if (cursor <= 0) return false;
  const [oldestEvent] = await db
    .select({ id: realtimeEvents.id })
    .from(realtimeEvents)
    .orderBy(asc(realtimeEvents.id))
    .limit(1);
  return Boolean(oldestEvent && cursor < oldestEvent.id - 1);
}
