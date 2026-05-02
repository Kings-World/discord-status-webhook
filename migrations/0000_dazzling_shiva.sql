CREATE TABLE "discord_status" (
	"incident_id" text PRIMARY KEY NOT NULL,
	"update_id" text NOT NULL,
	"message_id" text NOT NULL,
	"status" text NOT NULL,
	"created_at" timestamp (3) DEFAULT now() NOT NULL,
	"updated_at" timestamp (3) DEFAULT now() NOT NULL
);
