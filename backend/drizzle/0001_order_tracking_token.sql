ALTER TABLE "orders" ADD COLUMN "tracking_token" text;
CREATE UNIQUE INDEX "orders_tracking_token_uidx" ON "orders" USING btree ("tracking_token");
