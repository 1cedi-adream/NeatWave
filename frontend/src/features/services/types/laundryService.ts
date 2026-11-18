export type PricingModel =
  "per_item" | "per_weight" | "bundle" | "basket" | "flat_fee";

export type BasketOption = {
  id?: string;
  name: string;
  pricePesewas: number;
  sortOrder: number;
  active?: boolean;
};

export type ServicePrice = {
  unitPricePesewas?: number;
  basePricePesewas?: number;
  includedItemCount?: number;
  overagePricePesewas?: number;
};

export type LaundryService = {
  id: string;
  name: string;
  pricingModel: PricingModel;
  estimatedHours: number;
  active: boolean;
  price: ServicePrice | null;
  basketOptions: BasketOption[];
};

export type ServiceInput = Omit<
  LaundryService,
  "id" | "active" | "price" | "basketOptions"
> & { active?: boolean; price: ServicePrice; basketOptions: BasketOption[] };
