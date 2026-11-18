CREATE TABLE "realtime_events" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"room" text NOT NULL,
	"event_type" text NOT NULL,
	"payload" jsonb NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"locked_at" timestamp with time zone,
	"published_at" timestamp with time zone,
	"last_error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "realtime_publish_idx" ON "realtime_events" USING btree ("published_at","locked_at","id");--> statement-breakpoint
CREATE INDEX "realtime_room_cursor_idx" ON "realtime_events" USING btree ("room","id");--> statement-breakpoint
CREATE INDEX "realtime_retention_idx" ON "realtime_events" USING btree ("created_at");