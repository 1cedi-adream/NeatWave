import { z } from "zod";
import { paginationQuery } from "@/utils/pagination.js";
const statuses = ["Received", "Washing", "Ready for Pickup"] as const;
export const exportOrdersSchema = z.object({
  query: z.object({
    period: z.enum([
      "today",
      "yesterday",
      "last-week",
      "last-month",
      "last-year",
      "all-time",
    ]),
  }),
});
export const createOrderSchema = z.object({
  body: z.object({
    customerId: z.string().uuid(),
    dueAt: z.coerce.date().optional(),
    discountPesewas: z.number().int().min(0).default(0),
    taxBasisPoints: z.number().int().min(0).max(10000).optional(),
    notes: z.string().trim().max(1000).optional(),
    lines: z
      .array(
        z.object({
          serviceId: z.string().uuid(),
          quantity: z.number().positive().optional(),
          basketOptionId: z.string().uuid().optional(),
        }),
      )
      .min(1),
  }),
});
export const listOrdersSchema = z.object({
  query: paginationQuery.extend({
    status: z.enum(statuses).optional(),
    customerId: z.string().uuid().optional(),
  }),
});
export const statusSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: z.object({
    status: z.enum(statuses),
    note: z.string().trim().max(300).optional(),
  }),
});
export const paymentSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: z.object({
    amountPesewas: z.number().int().positive(),
    method: z.enum(["cash", "mobile_money", "card", "bank_transfer", "other"]),
    reference: z.string().trim().max(100).optional(),
  }),
});
export const refundSchema = z.object({
  params: z.object({ id: z.string().uuid(), paymentId: z.string().uuid() }),
  body: z.object({
    amountPesewas: z.number().int().positive(),
    reference: z.string().trim().max(100).optional(),
  }),
});
