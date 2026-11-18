import {
  boolean,
  index,
  pgTable,
  text,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { timestamps } from "./common.schema.js";
import { tenants } from "./tenants.schema.js";

export const customers = pgTable(
  "customers",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id),
    fullName: text("full_name").notNull(),
    phone: text("phone").notNull(),
    normalizedPhone: text("normalized_phone").notNull(),
    email: text("email"),
    normalizedEmail: text("normalized_email"),
    instructions: text("instructions"),
    smsConsent: boolean("sms_consent").notNull().default(true),
    emailConsent: boolean("email_consent").notNull().default(true),
    active: boolean("active").notNull().default(true),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("customers_tenant_phone_uidx").on(
      table.tenantId,
      table.normalizedPhone,
    ),
    index("customers_tenant_name_idx").on(table.tenantId, table.fullName),
  ],
);
