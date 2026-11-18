import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { randomUUID } from "node:crypto";
import { and, eq, gt, isNull, or } from "drizzle-orm";
import { db } from "@/db/index.js";
import {
  passwordResetTokens,
  refreshTokens,
  staffInvitations,
  tenantMemberships,
  tenants,
  users,
} from "@/db/schema/index.js";
import { env } from "@/config/env.js";
import {
  normalizeEmailAddress,
  normalizePhoneNumber,
} from "@/utils/contact-normalization.utils.js";
import { AppError } from "@/utils/errors.js";
import { createSecureToken, hashToken } from "@/utils/token.utils.js";
import { EmailProvider } from "@/modules/notifications/notifications.service.js";
import { enqueueRealtimeEvent } from "@/modules/realtime/realtime.service.js";
import { realtimeRooms } from "@/modules/realtime/realtime.types.js";

const accessToken = (userId: string, sessionId: string) =>
  jwt.sign({ type: "access", sid: sessionId }, env.JWT_ACCESS_SECRET, {
    subject: userId,
    expiresIn: env.ACCESS_TOKEN_TTL as jwt.SignOptions["expiresIn"],
  });

async function issueSession(userId: string, familyId: string = randomUUID()) {
  const id = randomUUID();
  const refresh = jwt.sign(
    { type: "refresh", jti: id, familyId },
    env.JWT_REFRESH_SECRET,
    { subject: userId, expiresIn: `${env.REFRESH_TOKEN_DAYS}d` },
  );
  await db.insert(refreshTokens).values({
    id,
    userId,
    familyId,
    tokenHash: hashToken(refresh),
    expiresAt: new Date(Date.now() + env.REFRESH_TOKEN_DAYS * 86_400_000),
  });
  return { accessToken: accessToken(userId, familyId), refreshToken: refresh };
}

export async function login(identifier: string, password: string) {
  const normalizedEmail = normalizeEmailAddress(identifier);
  const normalizedPhone = normalizePhoneNumber(identifier);
  const [user] = await db
    .select()
    .from(users)
    .where(
      or(eq(users.email, normalizedEmail), eq(users.phone, normalizedPhone)),
    )
    .limit(1);
  if (
    !user?.passwordHash ||
    !user.active ||
    !(await bcrypt.compare(password, user.passwordHash))
  )
    throw new AppError(
      401,
      "INVALID_CREDENTIALS",
      "Email, phone number, or password is incorrect.",
    );
  const [membership] = await db
    .select()
    .from(tenantMemberships)
    .where(
      and(
        eq(tenantMemberships.userId, user.id),
        eq(tenantMemberships.active, true),
      ),
    )
    .limit(1);
  return {
    user: {
      id: user.id,
      name: user.fullName,
      email: user.email,
      role:
        user.platformRole === "super_admin"
          ? "Superadmin"
          : membership?.role === "manager"
            ? "Manager"
            : "Staff",
      active: user.active,
    },
    ...(await issueSession(user.id)),
  };
}

export async function rotateRefreshToken(raw: string) {
  let claims: jwt.JwtPayload;
  try {
    claims = jwt.verify(raw, env.JWT_REFRESH_SECRET) as jwt.JwtPayload;
  } catch {
    throw new AppError(
      401,
      "INVALID_REFRESH_TOKEN",
      "Refresh token is invalid or expired.",
    );
  }
  if (claims.type !== "refresh" || !claims.jti || !claims.sub)
    throw new AppError(
      401,
      "INVALID_REFRESH_TOKEN",
      "Refresh token is invalid.",
    );
  const [stored] = await db
    .select()
    .from(refreshTokens)
    .where(eq(refreshTokens.id, claims.jti))
    .limit(1);
  if (
    !stored ||
    stored.tokenHash !== hashToken(raw) ||
    stored.expiresAt <= new Date()
  )
    throw new AppError(
      401,
      "INVALID_REFRESH_TOKEN",
      "Refresh token is invalid or expired.",
    );
  if (stored.revokedAt) {
    await db.transaction(async (transaction) => {
      await transaction
        .update(refreshTokens)
        .set({ revokedAt: new Date() })
        .where(eq(refreshTokens.familyId, stored.familyId));
      await enqueueRealtimeEvent(transaction, {
        rooms: [realtimeRooms.session(stored.familyId)],
        type: "access.revoked",
        payload: { reason: "refresh_token_reuse" },
      });
    });
    throw new AppError(
      401,
      "REFRESH_TOKEN_REUSED",
      "This session has been revoked.",
    );
  }
  const next = await issueSession(stored.userId, stored.familyId);
  const decoded = jwt.decode(next.refreshToken) as jwt.JwtPayload;
  await db
    .update(refreshTokens)
    .set({ revokedAt: new Date(), replacedById: decoded.jti })
    .where(eq(refreshTokens.id, stored.id));
  return next;
}

export async function logout(raw: string) {
  await db.transaction(async (transaction) => {
    const [revokedSession] = await transaction
      .update(refreshTokens)
      .set({ revokedAt: new Date() })
      .where(eq(refreshTokens.tokenHash, hashToken(raw)))
      .returning({ familyId: refreshTokens.familyId });
    if (revokedSession) {
      await enqueueRealtimeEvent(transaction, {
        rooms: [realtimeRooms.session(revokedSession.familyId)],
        type: "access.revoked",
        payload: { reason: "session_ended" },
      });
    }
  });
}

export async function requestReset(identifier: string) {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, normalizeEmailAddress(identifier)))
    .limit(1);
  if (!user) return null;
  const token = createSecureToken();
  await db.insert(passwordResetTokens).values({
    userId: user.id,
    tokenHash: hashToken(token),
    expiresAt: new Date(Date.now() + 3_600_000),
  });
  if (env.NODE_ENV === "production") {
    await new EmailProvider().send({
      recipient: user.email,
      subject: "Reset your NeatWave password",
      text: `Reset your NeatWave password: ${env.FRONTEND_URL}/reset-password/${token}`,
    });
  }
  return env.NODE_ENV === "production" ? null : token;
}

export async function resetPassword(token: string, password: string) {
  const [record] = await db
    .select()
    .from(passwordResetTokens)
    .where(
      and(
        eq(passwordResetTokens.tokenHash, hashToken(token)),
        isNull(passwordResetTokens.usedAt),
        gt(passwordResetTokens.expiresAt, new Date()),
      ),
    )
    .limit(1);
  if (!record)
    throw new AppError(
      400,
      "INVALID_RESET_TOKEN",
      "Reset token is invalid or expired.",
    );
  await db.transaction(async (tx) => {
    await tx
      .update(users)
      .set({
        passwordHash: await bcrypt.hash(password, 12),
        updatedAt: new Date(),
      })
      .where(eq(users.id, record.userId));
    await tx
      .update(passwordResetTokens)
      .set({ usedAt: new Date() })
      .where(eq(passwordResetTokens.id, record.id));
    await tx
      .update(refreshTokens)
      .set({ revokedAt: new Date() })
      .where(eq(refreshTokens.userId, record.userId));
    await enqueueRealtimeEvent(tx, {
      rooms: [realtimeRooms.user(record.userId)],
      type: "access.revoked",
      payload: { reason: "password_reset" },
    });
  });
}

export async function acceptInvitation(input: {
  token: string;
  fullName: string;
  phone?: string;
  password: string;
}) {
  const [invite] = await db
    .select()
    .from(staffInvitations)
    .where(
      and(
        eq(staffInvitations.tokenHash, hashToken(input.token)),
        isNull(staffInvitations.acceptedAt),
        gt(staffInvitations.expiresAt, new Date()),
      ),
    )
    .limit(1);
  if (!invite)
    throw new AppError(
      400,
      "INVALID_INVITATION",
      "Invitation is invalid or expired.",
    );
  const userId = await db.transaction(async (tx) => {
    const [existing] = await tx
      .select()
      .from(users)
      .where(eq(users.email, invite.email))
      .limit(1);
    const [user] = existing
      ? [existing]
      : await tx
          .insert(users)
          .values({
            fullName: input.fullName,
            email: invite.email,
            phone: input.phone,
            passwordHash: await bcrypt.hash(input.password, 12),
            emailVerifiedAt: new Date(),
          })
          .returning();
    if (!user) throw new Error("Could not create user");
    await tx
      .insert(tenantMemberships)
      .values({ tenantId: invite.tenantId, userId: user.id, role: invite.role })
      .onConflictDoNothing();
    await tx
      .update(staffInvitations)
      .set({ acceptedAt: new Date() })
      .where(eq(staffInvitations.id, invite.id));
    await enqueueRealtimeEvent(tx, {
      rooms: [realtimeRooms.tenant(invite.tenantId)],
      type: "staff.changed",
      payload: { userId: user.id, membershipAccepted: true },
    });
    await enqueueRealtimeEvent(tx, {
      rooms: [realtimeRooms.admin],
      type: "admin.tenants.changed",
      payload: { tenantId: invite.tenantId },
    });
    return user.id;
  });
  return issueSession(userId);
}

export async function getCurrentUser(userId: string) {
  const [user] = await db
    .select({
      id: users.id,
      name: users.fullName,
      email: users.email,
      platformRole: users.platformRole,
    })
    .from(users)
    .where(eq(users.id, userId));
  const [membership] = await db
    .select()
    .from(tenantMemberships)
    .innerJoin(
      tenants,
      and(eq(tenants.id, tenantMemberships.tenantId), eq(tenants.active, true)),
    )
    .where(
      and(
        eq(tenantMemberships.userId, userId),
        eq(tenantMemberships.active, true),
      ),
    )
    .limit(1);

  return {
    ...user,
    tenantId: membership?.tenant_memberships.tenantId ?? null,
    tenantRole: membership?.tenant_memberships.role ?? null,
  };
}

export async function updateCurrentUser(
  userId: string,
  changes: { name?: string; email?: string },
) {
  const user = await db.transaction(async (transaction) => {
    const [updatedUser] = await transaction
      .update(users)
      .set({
        ...(changes.name ? { fullName: changes.name } : {}),
        ...(changes.email
          ? { email: normalizeEmailAddress(changes.email) }
          : {}),
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();
    if (updatedUser) {
      await enqueueRealtimeEvent(transaction, {
        rooms: [realtimeRooms.user(userId)],
        type: "profile.changed",
        payload: {},
      });
    }
    return updatedUser;
  });

  if (!user) throw new AppError(404, "NOT_FOUND", "User not found.");
  return getCurrentUser(user.id);
}
