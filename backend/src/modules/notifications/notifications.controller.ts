import type { Request, Response } from "express";
import { and, desc, eq, isNull } from "drizzle-orm";
import { db } from "@/db/index.js";
import {
  inAppNotifications,
  notificationAttempts,
  notificationJobs,
} from "@/db/schema/index.js";
import { notFound } from "@/utils/errors.js";
import { enqueueRealtimeEvent } from "@/modules/realtime/realtime.service.js";
import { realtimeRooms } from "@/modules/realtime/realtime.types.js";

export async function list(req: Request, res: Response) {
  res.json({
    data: await db
      .select()
      .from(inAppNotifications)
      .where(eq(inAppNotifications.tenantId, req.auth!.tenantId!))
      .orderBy(desc(inAppNotifications.createdAt))
      .limit(100),
  });
}

export async function markRead(req: Request, res: Response) {
  const data = await db.transaction(async (transaction) => {
    const [readNotification] = await transaction
      .update(inAppNotifications)
      .set({ readAt: new Date() })
      .where(
        and(
          eq(inAppNotifications.id, req.params.id!),
          eq(inAppNotifications.tenantId, req.auth!.tenantId!),
        ),
      )
      .returning();
    if (readNotification) {
      await enqueueRealtimeEvent(transaction, {
        rooms: [realtimeRooms.tenant(req.auth!.tenantId!)],
        type: "notifications.changed",
        payload: { notificationId: readNotification.id },
      });
    }
    return readNotification;
  });
  if (!data) throw notFound("Notification");
  res.status(204).send();
}

export async function markAll(req: Request, res: Response) {
  await db.transaction(async (transaction) => {
    await transaction
      .update(inAppNotifications)
      .set({ readAt: new Date() })
      .where(
        and(
          eq(inAppNotifications.tenantId, req.auth!.tenantId!),
          isNull(inAppNotifications.readAt),
        ),
      );
    await enqueueRealtimeEvent(transaction, {
      rooms: [realtimeRooms.tenant(req.auth!.tenantId!)],
      type: "notifications.changed",
      payload: {},
    });
  });
  res.status(204).send();
}

export async function deliveries(req: Request, res: Response) {
  const data = await db
    .select()
    .from(notificationJobs)
    .where(eq(notificationJobs.tenantId, req.auth!.tenantId!))
    .orderBy(desc(notificationJobs.createdAt))
    .limit(100);
  res.json({ data });
}

export async function attempts(req: Request, res: Response) {
  const [job] = await db
    .select()
    .from(notificationJobs)
    .where(
      and(
        eq(notificationJobs.id, req.params.id!),
        eq(notificationJobs.tenantId, req.auth!.tenantId!),
      ),
    )
    .limit(1);
  if (!job) throw notFound("Notification job");
  res.json({
    data: await db
      .select()
      .from(notificationAttempts)
      .where(eq(notificationAttempts.jobId, job.id))
      .orderBy(desc(notificationAttempts.createdAt)),
  });
}

export async function retry(req: Request, res: Response) {
  const data = await db.transaction(async (transaction) => {
    const [retriedJob] = await transaction
      .update(notificationJobs)
      .set({
        state: "pending",
        attempts: 0,
        availableAt: new Date(),
        lastError: null,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(notificationJobs.id, req.params.id!),
          eq(notificationJobs.tenantId, req.auth!.tenantId!),
          eq(notificationJobs.state, "failed"),
        ),
      )
      .returning();
    if (retriedJob) {
      await enqueueRealtimeEvent(transaction, {
        rooms: [realtimeRooms.tenant(req.auth!.tenantId!)],
        type: "notifications.delivery.changed",
        payload: { jobId: retriedJob.id, state: retriedJob.state },
      });
    }
    return retriedJob;
  });
  if (!data) throw notFound("Failed notification job");
  res.status(202).json({ data });
}
