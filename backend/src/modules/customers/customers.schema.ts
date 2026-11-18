import { z } from "zod";
import { paginationQuery } from "@/utils/pagination.js";

const fields = z.object({
  fullName: z.string().trim().min(2),
  phone: z.string().trim().min(7),
  email: z.email().optional().or(z.literal("")),
  instructions: z.string().trim().optional(),
  smsConsent: z.boolean().default(true),
  emailConsent: z.boolean().default(true),
});

export const listCustomersSchema = z.object({ query: paginationQuery });
export const createCustomerSchema = z.object({ body: fields });

export const updateCustomerSchema = z.object({
  params: z.object({ id: z.uuid() }),
  body: fields.partial().refine((v) => Object.keys(v).length > 0),
});
