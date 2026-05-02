import { eq } from "drizzle-orm";
import { DateTime } from "luxon";
import { db } from "../db/drizzle.js";
import { discordStatus } from "../db/schema.js";
import type { IncidentSchema } from "../zod.js";
import { createAndSendStatus } from "./createAndSendStatus.js";
import { updateStatus } from "./updateStatus.js";

export async function processDiscordIncident(incident: IncidentSchema) {
	const status = await db.query.discordStatus.findFirst({
		where: eq(discordStatus.incidentId, incident.id),
	});
	if (!status) {
		await createAndSendStatus(incident);
		return;
	}

	const incidentUpdate = DateTime.fromJSDate(
		incident.updated_at ?? incident.created_at,
	);
	if (DateTime.fromJSDate(status.updatedAt) < incidentUpdate) {
		await updateStatus(status, incident);
	}
}
