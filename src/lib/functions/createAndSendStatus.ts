import { logger } from "../constants";
import { db } from "../db/drizzle";
import { discordStatus } from "../db/schema";
import { sendWebhookMessage } from "../webhook";
import type { IncidentSchema } from "../zod";

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
		const message = await sendWebhookMessage(incident);

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
