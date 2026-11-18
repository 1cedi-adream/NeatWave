import type { RequestHandler } from "express";
import jwt from "jsonwebtoken";
import { and, eq, gt, isNull } from "drizzle-orm";
import { db } from "@/db/index.js";
import {
  refreshTokens,
  tenantMemberships,
  tenants,
  users,
} from "@/db/schema/index.js";
import { env } from "@/config/env.js";
import { AppError } from "@/utils/errors.js";

export type AuthContext = {
  userId: string;
  platformRole: "super_admin" | "user";
  tenantId: string | null;
  tenantRole: "manager" | "staff" | null;
};

type AccessClaims = { sub: string; sid?: string; type: "access" };

export const authenticate: RequestHandler = async (req, _res, next) => {
  try {
    const raw = req.headers.authorization;

    if (!raw?.startsWith("Bearer "))
      throw new AppError(401, "UNAUTHENTICATED", "Authentication is required.");

    const claims = jwt.verify(
      raw.slice(7),
      env.JWT_ACCESS_SECRET,
    ) as AccessClaims;

    if (claims.type !== "access") throw new Error("Wrong token type");

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
        throw new AppError(401, "UNAUTHENTICATED", "The session has ended.");
    }

    const [user] = await db
      .select()
      .from(users)
      .where(and(eq(users.id, claims.sub), eq(users.active, true)))
      .limit(1);

    if (!user)
      throw new AppError(401, "UNAUTHENTICATED", "The account is unavailable.");

    const [membership] = await db
      .select({
        tenantId: tenantMemberships.tenantId,
        role: tenantMemberships.role,
      })
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

    req.auth = {
      userId: user.id,
      platformRole: user.platformRole,
      tenantId: membership?.tenantId ?? null,
      tenantRole: membership?.role ?? null,
    };
    next();
  } catch (error) {
    next(
      error instanceof AppError
        ? error
        : new AppError(
            401,
            "INVALID_TOKEN",
            "The access token is invalid or expired.",
          ),
    );
  }
};

export const requireTenant: RequestHandler = (req, _res, next) =>
  req.auth?.tenantId
    ? next()
    : next(
        new AppError(
          403,
          "TENANT_REQUIRED",
          "A tenant membership is required.",
        ),
      );

export const requireManager: RequestHandler = (req, _res, next) =>
  req.auth?.tenantRole === "manager"
    ? next()
    : next(new AppError(403, "FORBIDDEN", "Manager access is required."));

export const requireSuperAdmin: RequestHandler = (req, _res, next) =>
  req.auth?.platformRole === "super_admin"
    ? next()
    : next(new AppError(403, "FORBIDDEN", "Superadmin access is required."));
