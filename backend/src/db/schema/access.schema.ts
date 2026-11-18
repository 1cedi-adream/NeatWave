import {
  boolean,
  index,
  pgTable,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { tenantRole } from "./enums.schema.js";
import { timestamps } from "./common.schema.js";
import { tenants } from "./tenants.schema.js";
import { users } from "./users.schema.js";

export const tenantMemberships = pgTable(
  "tenant_memberships",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    role: tenantRole("role").notNull(),
    active: boolean("active").notNull().default(true),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("membership_tenant_user_uidx").on(table.tenantId, table.userId),
    index("membership_user_idx").on(table.userId),
  ],
);
