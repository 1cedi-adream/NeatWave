import { and, eq, lte, or, sql } from "drizzle-orm";
import { db } from "@/db/index.js";
import { notificationAttempts, notificationJobs } from "@/db/schema/index.js";
import { env } from "@/config/env.js";
import {
  EmailProvider,
  FakeProvider,
  MnotifyProvider,
  validateNotificationConfiguration,
} from "@/modules/notifications/notifications.service.js";
import { renderStatusMessage } from "@/modules/notifications/notifications.utils.js";
import { logger } from "@/utils/logger.js";
import { enqueueRealtimeEvent } from "@/modules/realtime/realtime.service.js";
import { realtimeRooms } from "@/modules/realtime/realtime.types.js";

const sms =
  env.NODE_ENV === "test" ? new FakeProvider() : new MnotifyProvider();

const email =
  env.NODE_ENV === "test" ? new FakeProvider() : new EmailProvider();

let running = true;

async function claim() {
  return db.transaction(async (tx) => {
    const [job] = await tx
      .select()
      .from(notificationJobs)
      .where(
        and(
          or(
            eq(notificationJobs.state, "pending"),
            and(
              eq(notificationJobs.state, "processing"),
              lte(notificationJobs.lockedAt, new Date(Date.now() - 300_000)),
            ),
          ),
          lte(notificationJobs.availableAt, new Date()),
        ),
      )
      .orderBy(notificationJobs.createdAt)
      .limit(1)
      .for("update", { skipLocked: true });

    if (!job) return null;

    const [claimed] = await tx
      .update(notificationJobs)
      .set({
        state: "processing",
        lockedAt: new Date(),
        attempts: sql`${notificationJobs.attempts}+1`,
        updatedAt: new Date(),
      })
      .where(eq(notificationJobs.id, job.id))
      .returning();
    if (claimed) {
      await enqueueRealtimeEvent(tx, {
        rooms: [realtimeRooms.tenant(claimed.tenantId)],
        type: "notifications.delivery.changed",
        payload: {
          jobId: claimed.id,
          state: claimed.state,
          attempt: claimed.attempts,
        },
      });
    }
    return claimed ?? null;
  });
}

async function run() {
  if (env.NODE_ENV !== "test") {
    validateNotificationConfiguration();
  }
  logger.info(
    { pollIntervalMs: env.WORKER_POLL_MS },
    "Notification worker started",
  );
  while (running) {
    const job = await claim();
    if (!job) {
      await new Promise((r) => setTimeout(r, env.WORKER_POLL_MS));
      continue;
    }
    logger.info(
      {
        jobId: job.id,
        channel: job.channel,
        template: job.template,
        attempt: job.attempts,
        recipientDomain:
          job.channel === "email" ? job.recipient.split("@").at(-1) : undefined,
      },
      "Delivering notification",
    );
    try {
      const content = renderStatusMessage(job.payload, job.template);
      const provider = job.channel === "sms" ? sms : email;
      const providerMessageId = await provider.send({
        recipient: job.recipient,
        ...content,
      });
      await db.transaction(async (tx) => {
        await tx
          .insert(notificationAttempts)
          .values({ jobId: job.id, successful: true, providerMessageId });
        await tx
          .update(notificationJobs)
          .set({
            state: "sent",
            sentAt: new Date(),
            lockedAt: null,
            updatedAt: new Date(),
          })
          .where(eq(notificationJobs.id, job.id));
        await enqueueRealtimeEvent(tx, {
          rooms: [realtimeRooms.tenant(job.tenantId)],
          type: "notifications.delivery.changed",
          payload: { jobId: job.id, state: "sent", attempt: job.attempts },
        });
      });
      logger.info(
        { jobId: job.id, providerMessageId },
        "Notification delivered",
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown provider error";
      const failed = job.attempts >= 5;
      const retryAt = new Date(
        Date.now() + Math.min(3_600_000, 30_000 * 2 ** job.attempts),
      );
      logger.error(
        {
          err: error,
          jobId: job.id,
          channel: job.channel,
          attempt: job.attempts,
          failed,
          retryAt: failed ? undefined : retryAt,
        },
        failed
          ? "Notification delivery failed permanently"
          : "Notification delivery failed; retry scheduled",
      );
      await db.transaction(async (tx) => {
        await tx.insert(notificationAttempts).values({
          jobId: job.id,
          successful: false,
          error: message.slice(0, 500),
        });
        await tx
          .update(notificationJobs)
          .set({
            state: failed ? "failed" : "pending",
            availableAt: retryAt,
            lockedAt: null,
            lastError: message.slice(0, 500),
            updatedAt: new Date(),
          })
          .where(eq(notificationJobs.id, job.id));
        await enqueueRealtimeEvent(tx, {
          rooms: [realtimeRooms.tenant(job.tenantId)],
          type: "notifications.delivery.changed",
          payload: {
            jobId: job.id,
            state: failed ? "failed" : "pending",
            attempt: job.attempts,
          },
        });
      });
    }
  }
}
process.on("SIGTERM", () => {
  running = false;
});

process.on("SIGINT", () => {
  running = false;
});

void run().catch((error) => {
  logger.fatal({ err: error }, "Notification worker could not start");
  process.exitCode = 1;
});
