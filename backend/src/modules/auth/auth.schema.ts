import { z } from "zod";

export const loginSchema = z.object({
  body: z.object({
    identifier: z.string().min(3),
    password: z.string().min(8),
  }),
});

export const refreshSchema = z.object({
  body: z.object({ refreshToken: z.string().min(20) }),
});

export const forgotSchema = z.object({
  body: z.object({ identifier: z.string().min(3) }),
});

export const resetSchema = z.object({
  body: z.object({
    token: z.string().min(20),
    password: z.string().min(8).max(128),
  }),
});

export const acceptInviteSchema = z.object({
  body: z.object({
    token: z.string().min(20),
    fullName: z.string().trim().min(2),
    phone: z.string().trim().optional(),
    password: z.string().min(8).max(128),
  }),
});

export const updateProfileSchema = z.object({
  body: z
    .object({
      name: z.string().trim().min(2).optional(),
      email: z.email().optional(),
    })
    .refine((profile) => Object.keys(profile).length > 0),
});
