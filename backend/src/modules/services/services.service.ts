import { and, eq } from "drizzle-orm";
import { db } from "@/db/index.js";
import { basketOptions, servicePrices, services } from "@/db/schema/index.js";
import { notFound } from "@/utils/errors.js";
import { enqueueRealtimeEvent } from "@/modules/realtime/realtime.service.js";
import { realtimeRooms } from "@/modules/realtime/realtime.types.js";

export async function listServices(tenantId: string, activeOnly: boolean) {
  const serviceRows = await db.query.services.findMany({
    where: and(
      eq(services.tenantId, tenantId),
      activeOnly ? eq(services.active, true) : undefined,
    ),
    with: {},
  });
  return Promise.all(
    serviceRows.map(async (service) => ({
      ...service,
      price:
        (
          await db
            .select()
            .from(servicePrices)
            .where(eq(servicePrices.serviceId, service.id))
        )[0] ?? null,
      basketOptions: await db
        .select()
        .from(basketOptions)
        .where(eq(basketOptions.serviceId, service.id)),
    })),
  );
}

export async function createService(
  tenantId: string,
  input: Record<string, unknown>,
) {
  const {
    price,
    basketOptions: options = [],
    ...serviceInput
  } = input as Record<string, unknown> & {
    price: typeof servicePrices.$inferInsert;
    basketOptions: Array<{
      name: string;
      pricePesewas: number;
      sortOrder: number;
    }>;
  };
  return db.transaction(async (transaction) => {
    const [service] = await transaction
      .insert(services)
      .values({ ...serviceInput, tenantId } as typeof services.$inferInsert)
      .returning();
    if (!service) throw new Error("Service creation failed");
    await transaction
      .insert(servicePrices)
      .values({ ...price, serviceId: service.id });
    if (options.length)
      await transaction
        .insert(basketOptions)
        .values(
          options.map((option) => ({ ...option, serviceId: service.id })),
        );
    await enqueueRealtimeEvent(transaction, {
      rooms: [realtimeRooms.tenant(tenantId)],
      type: "services.changed",
      payload: { serviceId: service.id },
    });
    return service;
  });
}

export async function updateService(
  tenantId: string,
  serviceId: string,
  input: Partial<typeof services.$inferInsert> & {
    price?: Partial<typeof servicePrices.$inferInsert>;
    basketOptions?: Array<{
      id?: string;
      name: string;
      pricePesewas: number;
      sortOrder: number;
    }>;
  },
) {
  const { price, basketOptions: submittedOptions, ...serviceChanges } = input;

  return db.transaction(async (transaction) => {
    const [service] = await transaction
      .update(services)
      .set({ ...serviceChanges, updatedAt: new Date() })
      .where(and(eq(services.id, serviceId), eq(services.tenantId, tenantId)))
      .returning();
    if (!service) throw notFound("Service");

    if (price) {
      await transaction
        .insert(servicePrices)
        .values({ serviceId, ...price })
        .onConflictDoUpdate({
          target: servicePrices.serviceId,
          set: { ...price, updatedAt: new Date() },
        });
    }

    if (submittedOptions) {
      const existingOptions = await transaction
        .select()
        .from(basketOptions)
        .where(eq(basketOptions.serviceId, serviceId));
      const submittedIds = new Set(
        submittedOptions.flatMap((option) => (option.id ? [option.id] : [])),
      );

      for (const option of existingOptions) {
        if (!submittedIds.has(option.id)) {
          await transaction
            .update(basketOptions)
            .set({ active: false, updatedAt: new Date() })
            .where(eq(basketOptions.id, option.id));
        }
      }

      for (const option of submittedOptions) {
        if (option.id) {
          await transaction
            .update(basketOptions)
            .set({ ...option, active: true, updatedAt: new Date() })
            .where(
              and(
                eq(basketOptions.id, option.id),
                eq(basketOptions.serviceId, serviceId),
              ),
            );
        } else {
          await transaction
            .insert(basketOptions)
            .values({ ...option, serviceId });
        }
      }
    }

    await enqueueRealtimeEvent(transaction, {
      rooms: [realtimeRooms.tenant(tenantId)],
      type: "services.changed",
      payload: { serviceId: service.id },
    });
    return service;
  });
}
