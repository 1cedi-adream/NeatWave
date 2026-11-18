import { eq } from "drizzle-orm";
import { db } from "@/db/index.js";
import { tenantSettings } from "@/db/schema/index.js";
import { enqueueRealtimeEvent } from "@/modules/realtime/realtime.service.js";
import { realtimeRooms } from "@/modules/realtime/realtime.types.js";

export async function getSettings(tenantId: string) {
  const [settings] = await db
    .select()
    .from(tenantSettings)
    .where(eq(tenantSettings.tenantId, tenantId));

  return settings;
}

export async function updateSettings(
  tenantId: string,
  changes: Partial<typeof tenantSettings.$inferInsert>,
) {
  const settings = await db.transaction(async (transaction) => {
    const [updatedSettings] = await transaction
      .update(tenantSettings)
      .set({ ...changes, updatedAt: new Date() })
      .where(eq(tenantSettings.tenantId, tenantId))
      .returning();
    if (updatedSettings) {
      await enqueueRealtimeEvent(transaction, {
        rooms: [realtimeRooms.tenant(tenantId)],
        type: "settings.changed",
        payload: {},
      });
      await enqueueRealtimeEvent(transaction, {
        rooms: [realtimeRooms.admin],
        type: "admin.tenants.changed",
        payload: { tenantId },
      });
    }
    return updatedSettings;
  });

  return settings;
}
