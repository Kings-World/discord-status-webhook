import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const discordStatus = pgTable("discord_status", {
	incidentId: text("incident_id").primaryKey(),
	updateId: text("update_id").notNull(),
	messageId: text("message_id").notNull(),
	status: text("status").notNull(),
	createdAt: timestamp("created_at", { mode: "date", precision: 3 })
		.notNull()
		.defaultNow(),
	updatedAt: timestamp("updated_at", { mode: "date", precision: 3 })
		.notNull()
		.defaultNow()
		.$onUpdate(() => new Date()),
});
