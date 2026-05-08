import { logger } from "../constants";
import { db } from "../db/drizzle";
import { discordStatus } from "../db/schema";
import { env } from "../env";
import { sendWebhookMessage } from "../webhook";
import type { IncidentSchema } from "../zod";
import { createEmbed } from "./createEmbed";

export async function createAndSendStatus(incident: IncidentSchema) {
	if (!incident.incident_updates[0]) {
		return logger.warn(
			`DiscordStatus[${incident.id}] Skipping creation of ${incident.name} because no incident updates were found`,
		);
	}

	logger.info(
		`DiscordStatus[${incident.id}] Sending ${incident.name} (${incident.status}) to Discord`,
	);

	try {
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
	} catch (error) {
		logger.error(
			`DiscordStatus[${incident.id}] Something went wrong while sending ${incident.name} (${incident.status}) to Discord`,
			error,
		);
	}
}
