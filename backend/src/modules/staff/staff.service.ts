import { and, eq } from "drizzle-orm";
import { db } from "@/db/index.js";
import {
  notificationJobs,
  staffInvitations,
  tenantMemberships,
  users,
} from "@/db/schema/index.js";
import { env } from "@/config/env.js";
import { normalizeEmailAddress } from "@/utils/contact-normalization.utils.js";
import { notFound } from "@/utils/errors.js";
import { createSecureToken, hashToken } from "@/utils/token.utils.js";
import { staffInvitationValidityMs } from "./staff.utils.js";
import { enqueueRealtimeEvent } from "@/modules/realtime/realtime.service.js";
import { realtimeRooms } from "@/modules/realtime/realtime.types.js";

export function listStaff(tenantId: string) {
  return db
    .select({
      membershipId: tenantMemberships.id,
      userId: users.id,
      name: users.fullName,
      email: users.email,
      phone: users.phone,
      role: tenantMemberships.role,
      active: tenantMemberships.active,
    })
    .from(tenantMemberships)
    .innerJoin(users, eq(users.id, tenantMemberships.userId))
    .where(eq(tenantMemberships.tenantId, tenantId));
}

export async function inviteStaff(
  tenantId: string,
  userId: string,
  input: { email: string; role: "manager" | "staff" },
) {
  const invitationToken = createSecureToken();
  const invitation = await db.transaction(async (transaction) => {
    const [createdInvitation] = await transaction
      .insert(staffInvitations)
      .values({
        tenantId,
        email: normalizeEmailAddress(input.email),
        role: input.role,
        tokenHash: hashToken(invitationToken),
        invitedBy: userId,
        expiresAt: new Date(Date.now() + staffInvitationValidityMs),
      })
      .returning();
    if (!createdInvitation) throw new Error("Could not create invitation");
    await transaction.insert(notificationJobs).values({
      tenantId,
      channel: "email",
      recipient: createdInvitation.email,
      template: "staff_invitation",
      payload: {
        businessName: "NeatWave laundry",
        invitationUrl: `${env.FRONTEND_URL}/accept-invite/${invitationToken}`,
      },
      idempotencyKey: `staff-invite:${createdInvitation.id}`,
    });
    await enqueueRealtimeEvent(transaction, {
      rooms: [realtimeRooms.tenant(tenantId)],
      type: "staff.changed",
      payload: { invitationId: createdInvitation.id },
    });
    return createdInvitation;
  });
  return {
    ...invitation,
    ...(process.env.NODE_ENV !== "production" ? { invitationToken } : {}),
  };
}

export async function updateStaff(
  tenantId: string,
  membershipId: string,
  changes: Partial<typeof tenantMemberships.$inferInsert>,
) {
  const membership = await db.transaction(async (transaction) => {
    const [updatedMembership] = await transaction
      .update(tenantMemberships)
      .set({ ...changes, updatedAt: new Date() })
      .where(
        and(
          eq(tenantMemberships.id, membershipId),
          eq(tenantMemberships.tenantId, tenantId),
        ),
      )
      .returning();

    if (updatedMembership) {
      await enqueueRealtimeEvent(transaction, {
        rooms: [realtimeRooms.tenant(tenantId)],
        type: "staff.changed",
        payload: {
          membershipId: updatedMembership.id,
          userId: updatedMembership.userId,
        },
      });
      await enqueueRealtimeEvent(transaction, {
        rooms: [realtimeRooms.admin],
        type: "admin.tenants.changed",
        payload: { tenantId },
      });
      if (changes.active === false) {
        await enqueueRealtimeEvent(transaction, {
          rooms: [realtimeRooms.user(updatedMembership.userId)],
          type: "access.revoked",
          payload: { reason: "membership_deactivated" },
        });
      }
    }
    return updatedMembership;
  });
  if (!membership) throw notFound("Staff membership");
  return membership;
}
