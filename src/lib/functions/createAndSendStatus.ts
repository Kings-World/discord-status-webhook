import { db } from "../db/drizzle.js";
import { discordStatus } from "../db/schema.js";
import { env } from "../env.js";
import { sendWebhookMessage } from "../webhook.js";
import type { IncidentSchema } from "../zod.js";
import { createEmbed } from "./createEmbed.js";

export async function createAndSendStatus(incident: IncidentSchema) {
	if (!incident.incident_updates[0]) {
		return console.warn(
			`DiscordStatus[${incident.id}] No incident updates found for ${incident.name}, skipping...`,
		);
	}

	console.log(
		`DiscordStatus[${incident.id}] Sending ${incident.name} (${incident.status}) to Discord`,
	);

	const message = await sendWebhookMessage({
		content: env.ROLE_ID && `<@&${env.ROLE_ID}>`,
		allowed_mentions: { roles: env.ROLE_ID ? [env.ROLE_ID] : [] },
		embeds: [createEmbed(incident)],
		wait: true,
	});

	await db.insert(discordStatus).values({
		incidentId: incident.id,
		messageId: message.id,
		status: incident.status,
		updateId: incident.incident_updates[0].id,
	});
}
