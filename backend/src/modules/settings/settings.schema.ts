import { z } from "zod";
const statuses = ["Received", "Washing", "Ready for Pickup"] as const;
export const updateSettingsSchema = z.object({
  body: z
    .object({
      businessName: z.string().trim().min(2).optional(),
      address: z.string().trim().optional(),
      phone: z.string().trim().optional(),
      email: z.email().or(z.literal("")).optional(),
      taxBasisPoints: z.number().int().min(0).max(10000).optional(),
      defaultCompletionHours: z.number().int().min(1).max(8760).optional(),
      receiptFooter: z.string().max(300).optional(),
      showContactOnReceipt: z.boolean().optional(),
      notifyStatuses: z.array(z.enum(statuses)).optional(),
      smsEnabled: z.boolean().optional(),
      emailEnabled: z.boolean().optional(),
      smsSenderId: z.string().trim().min(3).max(11).nullable().optional(),
    })
    .strict()
    .refine((settings) => Object.keys(settings).length > 0, {
      message: "Provide at least one setting to update.",
    }),
});
