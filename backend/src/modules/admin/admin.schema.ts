import { z } from "zod";
import { paginationQuery } from "@/utils/pagination.js";

export const listTenantsSchema = z.object({
  query: paginationQuery.extend({
    active: z.enum(["true", "false"]).optional(),
  }),
});

export const tenantParamsSchema = z.object({
  params: z.object({ id: z.uuid() }),
});

export const resendInvitationSchema = tenantParamsSchema;

export const provisionSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2),
    slug: z
      .string()
      .trim()
      .regex(/^[a-z0-9-]+$/),
    managerEmail: z.email(),
  }),
});

export const tenantStatusSchema = z.object({
  params: z.object({ id: z.uuid() }),
  body: z.object({ active: z.boolean() }),
});
