import { eq } from "drizzle-orm";
import { db } from "../db/drizzle.js";
import { discordStatus } from "../db/schema.js";
import { editWebhookMessage } from "../webhook.js";
import type { IncidentSchema } from "../zod.js";
import { createEmbed } from "./createEmbed.js";

export async function updateStatus(
	status: typeof discordStatus.$inferSelect,
	incident: IncidentSchema,
) {
	if (!incident.incident_updates[0]) {
		return console.warn(
			`DiscordStatus[${incident.id}] No incident updates found for ${incident.name}, skipping...`,
		);
	}

	console.log(
		`DiscordStatus[${incident.id}] Updating ${incident.name} from ${status.status} to ${incident.status}`,
	);

	await editWebhookMessage(status.messageId, {
		embeds: [createEmbed(incident)],
	});

	await db
		.update(discordStatus)
		.set({
			status: incident.status,
			updateId: incident.incident_updates[0].id,
		})
		.where(eq(discordStatus.incidentId, incident.id));
}
