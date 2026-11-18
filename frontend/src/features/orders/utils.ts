import type { LaundryService } from "@/features/services/types/laundryService";

export function estimateLineTotal(
  service: LaundryService,
  quantity = 1,
  basketOptionId?: string,
) {
  if (service.pricingModel === "basket")
    return (
      service.basketOptions.find((option) => option.id === basketOptionId)
        ?.pricePesewas ?? 0
    );
  if (service.pricingModel === "flat_fee")
    return service.price?.unitPricePesewas ?? 0;
  if (service.pricingModel === "bundle") {
    const included = service.price?.includedItemCount ?? 0;
    const overage =
      Math.max(0, quantity - included) *
      (service.price?.overagePricePesewas ?? 0);
    return (service.price?.basePricePesewas ?? 0) + overage;
  }
  return Math.round(quantity * (service.price?.unitPricePesewas ?? 0));
}
