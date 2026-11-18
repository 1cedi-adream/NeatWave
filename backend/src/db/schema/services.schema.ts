import {
  boolean,
  index,
  integer,
  pgTable,
  text,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { timestamps } from "./common.schema.js";
import { pricingModel } from "./enums.schema.js";
import { tenants } from "./tenants.schema.js";

export const services = pgTable(
  "services",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id),
    name: text("name").notNull(),
    pricingModel: pricingModel("pricing_model").notNull(),
    estimatedHours: integer("estimated_hours").notNull(),
    active: boolean("active").notNull().default(true),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("services_tenant_name_uidx").on(table.tenantId, table.name),
    index("services_tenant_active_idx").on(table.tenantId, table.active),
  ],
);

export const servicePrices = pgTable("service_prices", {
  serviceId: uuid("service_id")
    .primaryKey()
    .references(() => services.id),
  unitPricePesewas: integer("unit_price_pesewas"),
  basePricePesewas: integer("base_price_pesewas"),
  includedItemCount: integer("included_item_count"),
  overagePricePesewas: integer("overage_price_pesewas"),
  ...timestamps,
});

export const basketOptions = pgTable(
  "basket_options",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    serviceId: uuid("service_id")
      .notNull()
      .references(() => services.id),
    name: text("name").notNull(),
    pricePesewas: integer("price_pesewas").notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
    active: boolean("active").notNull().default(true),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("basket_service_name_uidx").on(table.serviceId, table.name),
  ],
);
