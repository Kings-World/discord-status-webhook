import { eq } from "drizzle-orm";
import { logger } from "../constants";
import { db } from "../db/drizzle";
import { discordStatus } from "../db/schema";
import { editWebhookMessage } from "../webhook";
import type { IncidentSchema } from "../zod";
import { createEmbed } from "./createEmbed";

export async function updateStatus(
	status: typeof discordStatus.$inferSelect,
	incident: IncidentSchema,
) {
	if (!incident.incident_updates[0]) {
		return logger.warn(
			`DiscordStatus[${incident.id}] Skipping update for ${incident.name} because no incident updates were found`,
		);
	}

	logger.info(
		`DiscordStatus[${incident.id}] Updating ${incident.name} from ${status.status} to ${incident.status}`,
	);

	try {
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
	} catch (error) {
		logger.error(
			`DiscordStatus[${incident.id}] Something went wrong while updating ${incident.name} from ${status.status} to ${incident.status}`,
			error,
		);
	}
}
