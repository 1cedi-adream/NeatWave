import {
  boolean,
  integer,
  pgTable,
  text,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { orderStatus } from "./enums.schema.js";
import { timestamps } from "./common.schema.js";

export const tenants = pgTable(
  "tenants",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    active: boolean("active").notNull().default(true),
    ...timestamps,
  },
  (table) => [uniqueIndex("tenants_slug_uidx").on(table.slug)],
);

export const tenantSettings = pgTable("tenant_settings", {
  tenantId: uuid("tenant_id")
    .primaryKey()
    .references(() => tenants.id),
  businessName: text("business_name").notNull(),
  address: text("address").notNull().default(""),
  phone: text("phone").notNull().default(""),
  email: text("email").notNull().default(""),
  currency: text("currency").notNull().default("GHS"),
  timezone: text("timezone").notNull().default("Africa/Accra"),
  taxBasisPoints: integer("tax_basis_points").notNull().default(0),
  defaultCompletionHours: integer("default_completion_hours")
    .notNull()
    .default(24),
  receiptFooter: text("receipt_footer")
    .notNull()
    .default("Thank you for choosing us."),
  showContactOnReceipt: boolean("show_contact_on_receipt")
    .notNull()
    .default(true),
  nextOrderNumber: integer("next_order_number").notNull().default(1),
  nextReceiptNumber: integer("next_receipt_number").notNull().default(1),
  notifyStatuses: orderStatus("notify_statuses")
    .array()
    .notNull()
    .default(["Ready for Pickup"]),
  smsEnabled: boolean("sms_enabled").notNull().default(true),
  emailEnabled: boolean("email_enabled").notNull().default(true),
  smsSenderId: text("sms_sender_id"),
  ...timestamps,
});
