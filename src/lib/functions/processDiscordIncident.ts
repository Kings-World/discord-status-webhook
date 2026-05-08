import { eq } from "drizzle-orm";
import { DateTime } from "luxon";
import { db } from "../db/drizzle";
import { discordStatus } from "../db/schema";
import type { IncidentSchema } from "../zod";
import { createAndSendStatus } from "./createAndSendStatus";
import { isResolveStatus } from "./isResolveStatus";
import { updateStatus } from "./updateStatus";

export async function processDiscordIncident(incident: IncidentSchema) {
	const status = await db.query.discordStatus.findFirst({
		where: eq(discordStatus.incidentId, incident.id),
	});
	if (!status) {
		if (isResolveStatus(incident.status)) return;
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
