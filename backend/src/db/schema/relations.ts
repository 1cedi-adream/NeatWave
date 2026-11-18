import { relations } from "drizzle-orm";
import { tenantMemberships } from "./access.schema.js";
import { customers } from "./customers.schema.js";
import {
  orderLines,
  orders,
  orderStatusHistory,
  payments,
} from "./orders.schema.js";
import { services } from "./services.schema.js";
import { tenants, tenantSettings } from "./tenants.schema.js";

export const tenantsRelations = relations(tenants, ({ one, many }) => ({
  settings: one(tenantSettings),
  memberships: many(tenantMemberships),
  customers: many(customers),
  services: many(services),
  orders: many(orders),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  customer: one(customers, {
    fields: [orders.customerId],
    references: [customers.id],
  }),
  lines: many(orderLines),
  statuses: many(orderStatusHistory),
  payments: many(payments),
}));
