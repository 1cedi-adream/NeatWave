import { and, count, desc, eq, ilike, or, sum } from "drizzle-orm";
import { env } from "@/config/env.js";
import { db } from "@/db/index.js";
import {
  customers,
  notificationJobs,
  orders,
  staffInvitations,
  tenantMemberships,
  tenants,
  tenantSettings,
} from "@/db/schema/index.js";
import { normalizeEmailAddress } from "@/utils/contact-normalization.utils.js";
import { AppError, notFound } from "@/utils/errors.js";
import { createPaginationMeta } from "@/utils/pagination.js";
import { createSecureToken, hashToken } from "@/utils/token.utils.js";
import { invitationValidityMs } from "./admin.utils.js";
import { enqueueRealtimeEvent } from "@/modules/realtime/realtime.service.js";
import { realtimeRooms } from "@/modules/realtime/realtime.types.js";

type TenantFilters = {
  page: number;
  pageSize: number;
  search?: string;
  active?: "true" | "false";
};

export async function getSummary() {
  const [tenantRows, customerRows, orderRows, orderValueRows, recentTenants] =
    await Promise.all([
      db
        .select({ active: tenants.active, value: count() })
        .from(tenants)
        .groupBy(tenants.active),
      db.select({ value: count() }).from(customers),
      db.select({ value: count() }).from(orders),
      db.select({ value: sum(orders.totalPesewas) }).from(orders),
      db.select().from(tenants).orderBy(desc(tenants.createdAt)),
    ]);
  const activeTenants = tenantRows.find((row) => row.active)?.value ?? 0;
  const inactiveTenants = tenantRows.find((row) => !row.active)?.value ?? 0;
  return {
    totalTenants: activeTenants + inactiveTenants,
    activeTenants,
    inactiveTenants,
    totalCustomers: customerRows[0]?.value ?? 0,
    totalOrders: orderRows[0]?.value ?? 0,
    totalOrderValuePesewas: Number(orderValueRows[0]?.value ?? 0),
    recentTenants,
  };
}

export async function listTenants(filters: TenantFilters) {
  const offset = (filters.page - 1) * filters.pageSize;
  const searchCondition = filters.search
    ? or(
        ilike(tenants.name, `%${filters.search}%`),
        ilike(tenants.slug, `%${filters.search}%`),
      )
    : undefined;
  const activeCondition = filters.active
    ? eq(tenants.active, filters.active === "true")
    : undefined;
  const where = and(searchCondition, activeCondition);
  const [data, totalRows] = await Promise.all([
    db
      .select()
      .from(tenants)
      .where(where)
      .orderBy(desc(tenants.createdAt))
      .limit(filters.pageSize)
      .offset(offset),
    db.select({ value: count() }).from(tenants).where(where),
  ]);
  const total = totalRows[0]?.value ?? 0;
  return {
    data,
    meta: createPaginationMeta(filters.page, filters.pageSize, total),
  };
}

export async function getTenant(tenantId: string) {
  const [tenant] = await db
    .select()
    .from(tenants)
    .where(eq(tenants.id, tenantId));
  if (!tenant) throw notFound("Tenant");
  const [settings, membershipRows, customerRows, orderRows, invitations] =
    await Promise.all([
      db
        .select()
        .from(tenantSettings)
        .where(eq(tenantSettings.tenantId, tenantId))
        .limit(1),
      db
        .select({
          role: tenantMemberships.role,
          active: tenantMemberships.active,
          value: count(),
        })
        .from(tenantMemberships)
        .where(eq(tenantMemberships.tenantId, tenantId))
        .groupBy(tenantMemberships.role, tenantMemberships.active),
      db
        .select({ value: count() })
        .from(customers)
        .where(eq(customers.tenantId, tenantId)),
      db
        .select({ value: count() })
        .from(orders)
        .where(eq(orders.tenantId, tenantId)),
      db
        .select({
          email: staffInvitations.email,
          role: staffInvitations.role,
          expiresAt: staffInvitations.expiresAt,
          acceptedAt: staffInvitations.acceptedAt,
        })
        .from(staffInvitations)
        .where(eq(staffInvitations.tenantId, tenantId))
        .orderBy(desc(staffInvitations.createdAt))
        .limit(1),
    ]);
  return {
    ...tenant,
    settings: settings[0] ?? null,
    memberships: membershipRows,
    customerCount: customerRows[0]?.value ?? 0,
    orderCount: orderRows[0]?.value ?? 0,
    managerInvitation: invitations[0] ?? null,
  };
}

export async function provisionTenant(
  userId: string,
  input: { name: string; slug: string; managerEmail: string },
) {
  const invitationToken = createSecureToken();
  try {
    const tenant = await db.transaction(async (transaction) => {
      const [createdTenant] = await transaction
        .insert(tenants)
        .values({ name: input.name, slug: input.slug })
        .returning();
      if (!createdTenant) throw new Error("Tenant creation failed");
      await transaction.insert(tenantSettings).values({
        tenantId: createdTenant.id,
        businessName: createdTenant.name,
      });
      const [invitation] = await transaction
        .insert(staffInvitations)
        .values({
          tenantId: createdTenant.id,
          email: normalizeEmailAddress(input.managerEmail),
          role: "manager",
          tokenHash: hashToken(invitationToken),
          invitedBy: userId,
          expiresAt: new Date(Date.now() + invitationValidityMs),
        })
        .returning();
      await transaction.insert(notificationJobs).values({
        tenantId: createdTenant.id,
        channel: "email",
        recipient: normalizeEmailAddress(input.managerEmail),
        template: "staff_invitation",
        payload: {
          businessName: createdTenant.name,
          invitationUrl: `${env.FRONTEND_URL}/accept-invite/${invitationToken}`,
        },
        idempotencyKey: `tenant-manager-invite:${invitation!.id}`,
      });
      await enqueueRealtimeEvent(transaction, {
        rooms: [realtimeRooms.admin],
        type: "admin.tenants.changed",
        payload: { tenantId: createdTenant.id },
      });
      await enqueueRealtimeEvent(transaction, {
        rooms: [realtimeRooms.admin],
        type: "platform.summary.changed",
        payload: {},
      });
      return createdTenant;
    });
    return {
      ...tenant,
      ...(env.NODE_ENV !== "production" ? { invitationToken } : {}),
    };
  } catch (error) {
    if (error instanceof Error && error.message.includes("tenants_slug_uidx"))
      throw new AppError(
        409,
        "SLUG_CONFLICT",
        "This laundry URL is already in use.",
      );
    throw error;
  }
}

export async function updateTenantStatus(tenantId: string, active: boolean) {
  const tenant = await db.transaction(async (transaction) => {
    const [updatedTenant] = await transaction
      .update(tenants)
      .set({ active, updatedAt: new Date() })
      .where(eq(tenants.id, tenantId))
      .returning();
    if (updatedTenant) {
      await enqueueRealtimeEvent(transaction, {
        rooms: [realtimeRooms.admin],
        type: "admin.tenants.changed",
        payload: { tenantId: updatedTenant.id },
      });
      await enqueueRealtimeEvent(transaction, {
        rooms: [realtimeRooms.admin],
        type: "platform.summary.changed",
        payload: {},
      });
      if (!active) {
        await enqueueRealtimeEvent(transaction, {
          rooms: [realtimeRooms.tenant(tenantId)],
          type: "access.revoked",
          payload: { reason: "tenant_deactivated" },
        });
      }
    }
    return updatedTenant;
  });
  if (!tenant) throw notFound("Tenant");
  return tenant;
}

export async function resendManagerInvitation(
  adminUserId: string,
  tenantId: string,
) {
  const [tenant] = await db
    .select()
    .from(tenants)
    .where(eq(tenants.id, tenantId));
  if (!tenant) throw notFound("Tenant");

  const invitationToken = createSecureToken();
  const invitationResult = await db.transaction(async (transaction) => {
    const [latestInvitation] = await transaction
      .select()
      .from(staffInvitations)
      .where(eq(staffInvitations.tenantId, tenantId))
      .orderBy(desc(staffInvitations.createdAt))
      .limit(1);
    if (!latestInvitation) throw notFound("Manager invitation");

    const [newInvitation] = await transaction
      .insert(staffInvitations)
      .values({
        tenantId,
        email: latestInvitation.email,
        role: "manager",
        tokenHash: hashToken(invitationToken),
        invitedBy: adminUserId,
        expiresAt: new Date(Date.now() + invitationValidityMs),
      })
      .returning();
    if (!newInvitation) throw new Error("Could not create manager invitation");

    const invitationUrl = `${env.FRONTEND_URL}/accept-invite/${invitationToken}`;
    await transaction.insert(notificationJobs).values({
      tenantId,
      channel: "email",
      recipient: latestInvitation.email,
      template: "staff_invitation",
      payload: { businessName: tenant.name, invitationUrl },
      idempotencyKey: `tenant-manager-resend:${newInvitation.id}`,
    });
    await enqueueRealtimeEvent(transaction, {
      rooms: [realtimeRooms.admin],
      type: "admin.tenants.changed",
      payload: { tenantId },
    });
    return { email: latestInvitation.email, invitationUrl };
  });

  return {
    email: invitationResult.email,
    delivery: "queued",
    ...(env.NODE_ENV !== "production"
      ? { invitationUrl: invitationResult.invitationUrl }
      : {}),
  };
}
