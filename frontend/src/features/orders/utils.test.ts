import { describe, expect, it } from "vitest";
import type { LaundryService } from "@/features/services/types/laundryService";
import { estimateLineTotal } from "./utils";

function service(
  pricingModel: LaundryService["pricingModel"],
  price: LaundryService["price"],
  basketOptions: LaundryService["basketOptions"] = [],
): LaundryService {
  return {
    id: "service",
    name: "Service",
    pricingModel,
    estimatedHours: 24,
    active: true,
    price,
    basketOptions,
  };
}

describe("estimateLineTotal", () => {
  it("estimates item and weight pricing", () => {
    expect(
      estimateLineTotal(service("per_item", { unitPricePesewas: 300 }), 4),
    ).toBe(1200);
    expect(
      estimateLineTotal(service("per_weight", { unitPricePesewas: 500 }), 2.5),
    ).toBe(1250);
  });

  it("estimates bundles with overage", () => {
    expect(
      estimateLineTotal(
        service("bundle", {
          basePricePesewas: 6000,
          includedItemCount: 20,
          overagePricePesewas: 200,
        }),
        24,
      ),
    ).toBe(6800);
  });

  it("estimates baskets and flat fees", () => {
    expect(
      estimateLineTotal(
        service("basket", null, [
          { id: "large", name: "Large", pricePesewas: 18000, sortOrder: 0 },
        ]),
        1,
        "large",
      ),
    ).toBe(18000);
    expect(
      estimateLineTotal(service("flat_fee", { unitPricePesewas: 4500 }), 9),
    ).toBe(4500);
  });
});
