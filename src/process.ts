import { eq } from "drizzle-orm";
import { Config, Effect } from "effect";
import { DateTime } from "luxon";
import { StatusConfig } from "./constants.js";
import { Drizzle } from "./db/drizzle.js";
import { discordStatus } from "./db/schema.js";
import { createEmbed } from "./embed.js";
import type { IncidentSchemaType, IncidentStatusType } from "./schema.js";
import { Webhook } from "./webhook.js";

export const createAndSendStatus = Effect.fn("createAndSendStatus")(function* (
	incident: IncidentSchemaType,
) {
	yield* Effect.logInfo(
		`Sending ${incident.name} (${incident.id}) to Discord with a status of ${incident.status}`,
	);

	const webhookClient = yield* Webhook;
	const statusData = yield* StatusConfig;
	const embed = yield* createEmbed(statusData, incident);
	const roleId = yield* Config.withDefault(Config.string("ROLE_ID"), null);

	const message = yield* webhookClient.use((wc) =>
		wc.send({
			content: roleId ? `<@&${roleId}>` : undefined,
			allowedMentions: { roles: roleId ? [roleId] : [] },
			embeds: [embed],
		}),
	);

	yield* Effect.logInfo("Saving the incident into the database");

	const drizzle = yield* Drizzle;
	yield* drizzle.use((db) =>
		db.insert(discordStatus).values({
			incidentId: incident.id,
			messageId: message.id,
			status: incident.status,
			updateId: incident.incident_updates[0].id,
		}),
	);

	yield* Effect.logInfo(
		"The incident has been sent and saved into the database",
	);
});

export const updateStatus = Effect.fn("updateStatus")(function* (
	saved: typeof discordStatus.$inferSelect,
	incident: IncidentSchemaType,
) {
	yield* Effect.logInfo(
		`Updating the status for ${incident.name} (${incident.id}) from ${saved.status} to ${incident.status}`,
	);

	const webhookClient = yield* Webhook;
	const statusData = yield* StatusConfig;
	const embed = yield* createEmbed(statusData, incident);
	yield* webhookClient.use((wc) =>
		wc.editMessage(saved.messageId, { embeds: [embed] }),
	);

	const drizzle = yield* Drizzle;
	yield* drizzle.use((db) =>
		db
			.update(discordStatus)
			.set({
				status: incident.status,
				updateId: incident.incident_updates[0].id,
			})
			.where(eq(discordStatus.incidentId, incident.id)),
	);
});

export const isResolvedStatus = (status: IncidentStatusType) =>
	status === "postmortem" || status === "resolved";

export const processIncident = Effect.fn("processIncident")(function* (
	incident: IncidentSchemaType,
) {
	const drizzle = yield* Drizzle;

	const current = yield* drizzle.use((db) =>
		db.query.discordStatus.findFirst({
			where: eq(discordStatus.incidentId, incident.id),
		}),
	);

	if (!current) {
		if (isResolvedStatus(incident.status)) return;
		return yield* createAndSendStatus(incident);
	}

	const incidentUpdate = DateTime.fromJSDate(
		incident.updated_at ?? incident.created_at,
	);
	if (DateTime.fromJSDate(current.updatedAt) < incidentUpdate) {
		yield* updateStatus(current, incident);
	}
});
