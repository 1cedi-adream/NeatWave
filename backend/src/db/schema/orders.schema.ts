import {
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { customers } from "./customers.schema.js";
import {
  orderStatus,
  paymentKind,
  paymentMethod,
  pricingModel,
} from "./enums.schema.js";
import { services, basketOptions } from "./services.schema.js";
import { tenants } from "./tenants.schema.js";
import { users } from "./users.schema.js";
import { timestamps } from "./common.schema.js";

export const orders = pgTable(
  "orders",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id),
    customerId: uuid("customer_id")
      .notNull()
      .references(() => customers.id),
    orderNumber: text("order_number").notNull(),
    trackingTokenHash: text("tracking_token_hash").notNull(),
    trackingToken: text("tracking_token"),
    status: orderStatus("status").notNull().default("Received"),
    dueAt: timestamp("due_at", { withTimezone: true }).notNull(),
    subtotalPesewas: integer("subtotal_pesewas").notNull(),
    discountPesewas: integer("discount_pesewas").notNull().default(0),
    taxPesewas: integer("tax_pesewas").notNull().default(0),
    totalPesewas: integer("total_pesewas").notNull(),
    notes: text("notes"),
    createdBy: uuid("created_by")
      .notNull()
      .references(() => users.id),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("orders_tenant_number_uidx").on(
      table.tenantId,
      table.orderNumber,
    ),
    uniqueIndex("orders_tracking_uidx").on(table.trackingTokenHash),
    uniqueIndex("orders_tracking_token_uidx").on(table.trackingToken),
    index("orders_tenant_status_idx").on(table.tenantId, table.status),
    index("orders_tenant_customer_idx").on(table.tenantId, table.customerId),
  ],
);

export const orderLines = pgTable(
  "order_lines",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id),
    serviceId: uuid("service_id")
      .notNull()
      .references(() => services.id),
    serviceName: text("service_name").notNull(),
    pricingModel: pricingModel("pricing_model").notNull(),
    quantity: numeric("quantity", { precision: 10, scale: 2 }),
    basketOptionId: uuid("basket_option_id").references(() => basketOptions.id),
    basketName: text("basket_name"),
    pricingSnapshot: jsonb("pricing_snapshot").notNull(),
    unitPricePesewas: integer("unit_price_pesewas"),
    lineTotalPesewas: integer("line_total_pesewas").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("order_lines_order_idx").on(table.orderId)],
);

export const orderStatusHistory = pgTable(
  "order_status_history",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id),
    fromStatus: orderStatus("from_status"),
    toStatus: orderStatus("to_status").notNull(),
    changedBy: uuid("changed_by")
      .notNull()
      .references(() => users.id),
    note: text("note"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("status_history_order_idx").on(table.orderId, table.createdAt),
  ],
);

export const payments = pgTable(
  "payments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id),
    kind: paymentKind("kind").notNull().default("payment"),
    method: paymentMethod("method").notNull(),
    amountPesewas: integer("amount_pesewas").notNull(),
    reference: text("reference"),
    parentPaymentId: uuid("parent_payment_id"),
    recordedBy: uuid("recorded_by")
      .notNull()
      .references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("payments_tenant_order_idx").on(table.tenantId, table.orderId),
  ],
);

export const receipts = pgTable(
  "receipts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id),
    receiptNumber: text("receipt_number").notNull(),
    snapshot: jsonb("snapshot").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("receipts_tenant_number_uidx").on(
      table.tenantId,
      table.receiptNumber,
    ),
    index("receipts_order_idx").on(table.orderId),
  ],
);
