import { AppError } from "@/utils/errors.js";
import type { PricingInput } from "./orders.types.js";

function requirePositiveNumber(value: number | undefined, fieldName: string) {
  if (value === undefined || value <= 0) {
    throw new AppError(
      400,
      "INVALID_PRICING",
      `${fieldName} must be positive.`,
    );
  }
  return value;
}

export function calculateLineTotal(input: PricingInput) {
  switch (input.model) {
    case "per_item":
    case "per_weight":
      return Math.round(
        requirePositiveNumber(input.quantity, "quantity") *
          requirePositiveNumber(input.unitPricePesewas, "unitPricePesewas"),
      );
    case "flat_fee":
      return requirePositiveNumber(input.unitPricePesewas, "unitPricePesewas");
    case "basket":
      return requirePositiveNumber(
        input.basketPricePesewas,
        "basketPricePesewas",
      );
    case "bundle": {
      const quantity = requirePositiveNumber(input.quantity, "quantity");
      const includedItemCount = requirePositiveNumber(
        input.includedItemCount,
        "includedItemCount",
      );
      const basePricePesewas = requirePositiveNumber(
        input.basePricePesewas,
        "basePricePesewas",
      );
      const overagePricePesewas = requirePositiveNumber(
        input.overagePricePesewas,
        "overagePricePesewas",
      );
      return (
        basePricePesewas +
        Math.max(0, Math.ceil(quantity) - includedItemCount) *
          overagePricePesewas
      );
    }
  }
}

export function calculateOrderTotals(
  lineTotals: number[],
  discountPesewas: number,
  taxBasisPoints: number,
) {
  const subtotalPesewas = lineTotals.reduce(
    (runningTotal, lineTotal) => runningTotal + lineTotal,
    0,
  );
  if (discountPesewas < 0 || discountPesewas > subtotalPesewas) {
    throw new AppError(
      400,
      "INVALID_DISCOUNT",
      "Discount cannot exceed the subtotal.",
    );
  }
  const taxableAmountPesewas = subtotalPesewas - discountPesewas;
  const taxPesewas = Math.round(
    (taxableAmountPesewas * taxBasisPoints) / 10_000,
  );
  return {
    subtotalPesewas,
    discountPesewas,
    taxPesewas,
    totalPesewas: taxableAmountPesewas + taxPesewas,
  };
}

const orderStatusSequence = [
  "Received",
  "Washing",
  "Ready for Pickup",
] as const;

export function validateStatusTransition(
  currentStatus: string,
  nextStatus: string,
) {
  const currentIndex = orderStatusSequence.indexOf(
    currentStatus as (typeof orderStatusSequence)[number],
  );
  const nextIndex = orderStatusSequence.indexOf(
    nextStatus as (typeof orderStatusSequence)[number],
  );
  if (nextIndex !== currentIndex + 1) {
    throw new AppError(
      409,
      "INVALID_STATUS_TRANSITION",
      "Order status must follow Received, Washing, then Ready for Pickup.",
    );
  }
}
