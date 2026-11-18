import { describe, expect, it } from "vitest";
import { calculateLineTotal, calculateOrderTotals } from "./orders.utils.js";

describe("calculateLineTotal", () => {
  it("prices individual items", () =>
    expect(
      calculateLineTotal({
        model: "per_item",
        quantity: 3,
        unitPricePesewas: 1250,
      }),
    ).toBe(3750));
  it("prices weight and rounds to pesewas", () =>
    expect(
      calculateLineTotal({
        model: "per_weight",
        quantity: 2.25,
        unitPricePesewas: 1001,
      }),
    ).toBe(2252));
  it("charges per-item overage on a bundle", () =>
    expect(
      calculateLineTotal({
        model: "bundle",
        quantity: 23,
        basePricePesewas: 6000,
        includedItemCount: 20,
        overagePricePesewas: 400,
      }),
    ).toBe(7200));
  it("uses the selected basket price", () =>
    expect(
      calculateLineTotal({ model: "basket", basketPricePesewas: 18000 }),
    ).toBe(18000));
  it("charges a flat fee once", () =>
    expect(
      calculateLineTotal({ model: "flat_fee", unitPricePesewas: 6000 }),
    ).toBe(6000));
});

describe("calculateOrderTotals", () => {
  it("applies discount before tax and rounds once", () =>
    expect(calculateOrderTotals([6000, 18000], 1000, 1250)).toEqual({
      subtotalPesewas: 24000,
      discountPesewas: 1000,
      taxPesewas: 2875,
      totalPesewas: 25875,
    }));
  it("rejects a discount larger than the subtotal", () =>
    expect(() => calculateOrderTotals([1000], 1001, 0)).toThrow(
      "Discount cannot exceed",
    ));
});
