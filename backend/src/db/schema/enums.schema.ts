import { pgEnum } from "drizzle-orm/pg-core";

export const platformRole = pgEnum("platform_role", ["super_admin", "user"]);
export const tenantRole = pgEnum("tenant_role", ["manager", "staff"]);
export const pricingModel = pgEnum("pricing_model", [
  "per_item",
  "per_weight",
  "bundle",
  "basket",
  "flat_fee",
]);
export const orderStatus = pgEnum("order_status", [
  "Received",
  "Washing",
  "Ready for Pickup",
]);
export const paymentMethod = pgEnum("payment_method", [
  "cash",
  "mobile_money",
  "card",
  "bank_transfer",
  "other",
]);
export const paymentKind = pgEnum("payment_kind", ["payment", "refund"]);
export const notificationChannel = pgEnum("notification_channel", [
  "sms",
  "email",
]);
export const notificationState = pgEnum("notification_state", [
  "pending",
  "processing",
  "sent",
  "failed",
]);
