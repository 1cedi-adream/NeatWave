export type PricingInput = {
  model: "per_item" | "per_weight" | "bundle" | "basket" | "flat_fee";
  quantity?: number;
  unitPricePesewas?: number;
  basePricePesewas?: number;
  includedItemCount?: number;
  overagePricePesewas?: number;
  basketPricePesewas?: number;
};
