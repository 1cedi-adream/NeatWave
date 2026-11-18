import { z } from "zod";

export const inviteSchema = z.object({
  body: z.object({
    email: z.email(),
    role: z.enum(["manager", "staff"]),
  }),
});

export const updateSchema = z.object({
  params: z.object({ id: z.uuid() }),
  body: z
    .object({
      role: z.enum(["manager", "staff"]).optional(),
      active: z.boolean().optional(),
    })
    .refine((v) => Object.keys(v).length > 0),
});
