import { and, count, desc, eq, ilike, or } from "drizzle-orm";
import { db } from "@/db/index.js";
import { customers, orders } from "@/db/schema/index.js";
import {
  normalizeEmailAddress,
  normalizePhoneNumber,
} from "@/utils/contact-normalization.utils.js";
import { notFound } from "@/utils/errors.js";
import { createPaginationMeta } from "@/utils/pagination.js";
import { enqueueRealtimeEvent } from "@/modules/realtime/realtime.service.js";
import { realtimeRooms } from "@/modules/realtime/realtime.types.js";

type CustomerListQuery = { page: number; pageSize: number; search?: string };

export async function listCustomers(
  tenantId: string,
  query: CustomerListQuery,
) {
  const filter = and(
    eq(customers.tenantId, tenantId),
    query.search
      ? or(
          ilike(customers.fullName, `%${query.search}%`),
          ilike(customers.phone, `%${query.search}%`),
          ilike(customers.email, `%${query.search}%`),
        )
      : undefined,
  );

  const [customerRows, countRows] = await Promise.all([
    db
      .select()
      .from(customers)
      .where(filter)
      .orderBy(desc(customers.createdAt))
      .limit(query.pageSize)
      .offset((query.page - 1) * query.pageSize),
    db.select({ value: count() }).from(customers).where(filter),
  ]);

  return {
    data: customerRows,
    meta: createPaginationMeta(
      query.page,
      query.pageSize,
      countRows[0]?.value ?? 0,
    ),
  };
}

export async function createCustomer(
  tenantId: string,
  input: typeof customers.$inferInsert,
) {
  const email = input.email || null;
  const customer = await db.transaction(async (transaction) => {
    const [createdCustomer] = await transaction
      .insert(customers)
      .values({
        ...input,
        tenantId,
        email,
        normalizedEmail: email ? normalizeEmailAddress(email) : null,
        normalizedPhone: normalizePhoneNumber(input.phone),
      })
      .returning();

    if (!createdCustomer) throw new Error("Customer creation failed");
    await enqueueRealtimeEvent(transaction, {
      rooms: [realtimeRooms.tenant(tenantId)],
      type: "customers.changed",
      payload: { customerId: createdCustomer.id },
    });
    await enqueueRealtimeEvent(transaction, {
      rooms: [realtimeRooms.admin],
      type: "platform.summary.changed",
      payload: { tenantId },
    });
    return createdCustomer;
  });

  return customer;
}

export async function updateCustomer(
  tenantId: string,
  customerId: string,
  changes: Partial<typeof customers.$inferInsert>,
) {
  const customer = await db.transaction(async (transaction) => {
    const [updatedCustomer] = await transaction
      .update(customers)
      .set({
        ...changes,
        ...(changes.phone
          ? { normalizedPhone: normalizePhoneNumber(changes.phone) }
          : {}),
        ...(changes.email !== undefined
          ? {
              email: changes.email || null,
              normalizedEmail: changes.email
                ? normalizeEmailAddress(changes.email)
                : null,
            }
          : {}),
        updatedAt: new Date(),
      })
      .where(
        and(eq(customers.id, customerId), eq(customers.tenantId, tenantId)),
      )
      .returning();

    if (updatedCustomer) {
      await enqueueRealtimeEvent(transaction, {
        rooms: [realtimeRooms.tenant(tenantId)],
        type: "customers.changed",
        payload: { customerId: updatedCustomer.id },
      });
    }
    return updatedCustomer;
  });

  if (!customer) throw notFound("Customer");
  return customer;
}

export async function getCustomer(tenantId: string, customerId: string) {
  const [customer] = await db
    .select()
    .from(customers)
    .where(and(eq(customers.id, customerId), eq(customers.tenantId, tenantId)))
    .limit(1);
  if (!customer) throw notFound("Customer");

  const orderHistory = await db
    .select()
    .from(orders)
    .where(
      and(eq(orders.customerId, customer.id), eq(orders.tenantId, tenantId)),
    )
    .orderBy(desc(orders.createdAt));
  return { ...customer, orders: orderHistory };
}
