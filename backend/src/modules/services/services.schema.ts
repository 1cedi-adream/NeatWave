import { z } from "zod";

const model = z.enum([
  "per_item",
  "per_weight",
  "bundle",
  "basket",
  "flat_fee",
]);

const basket = z.object({
  id: z.uuid().optional(),
  name: z.string().trim().min(1),
  pricePesewas: z.number().int().positive(),
  sortOrder: z.number().int().min(0).default(0),
});

const price = z.object({
  unitPricePesewas: z.number().int().positive().optional(),
  basePricePesewas: z.number().int().positive().optional(),
  includedItemCount: z.number().int().positive().optional(),
  overagePricePesewas: z.number().int().positive().optional(),
});

export const createServiceSchema = z.object({
  body: z
    .object({
      name: z.string().trim().min(2),
      pricingModel: model,
      estimatedHours: z.number().int().positive(),
      price,
      basketOptions: z.array(basket).default([]),
    })
    .superRefine((v, ctx) => {
      if (
        ["per_item", "per_weight", "flat_fee"].includes(v.pricingModel) &&
        !v.price.unitPricePesewas
      )
        ctx.addIssue({
          code: "custom",
          message: "unitPricePesewas is required",
          path: ["price", "unitPricePesewas"],
        });
      if (
        v.pricingModel === "bundle" &&
        (!v.price.basePricePesewas ||
          !v.price.includedItemCount ||
          !v.price.overagePricePesewas)
      )
        ctx.addIssue({
          code: "custom",
          message: "Bundle prices are incomplete",
          path: ["price"],
        });
      if (v.pricingModel === "basket" && !v.basketOptions.length)
        ctx.addIssue({
          code: "custom",
          message: "At least one basket option is required",
          path: ["basketOptions"],
        });
    }),
});

export const updateServiceSchema = z.object({
  params: z.object({ id: z.uuid() }),
  body: z
    .object({
      name: z.string().trim().min(2).optional(),
      pricingModel: model.optional(),
      estimatedHours: z.number().int().positive().optional(),
      active: z.boolean().optional(),
      price: price.optional(),
      basketOptions: z.array(basket).optional(),
    })
    .refine((v) => Object.keys(v).length > 0),
});
