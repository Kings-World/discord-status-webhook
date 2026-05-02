import { eq } from "drizzle-orm";
import { Config, Effect } from "effect";
import { DateTime } from "luxon";
import { StatusConfig } from "./constants.js";
import { Drizzle } from "./db/drizzle.js";
import { discordStatus } from "./db/schema.js";
import { createEmbed } from "./embed.js";
import type { IncidentSchemaType, IncidentStatusType } from "./schema.js";
import { Webhook, WebhookError } from "./webhook.js";

export const createAndSendStatus = Effect.fn("createAndSendStatus")(function* (
	incident: IncidentSchemaType,
) {
	const startTime = Date.now();
	const webhook = yield* Webhook;
	const statusData = yield* StatusConfig;
	const roleId = yield* Config.withDefault(Config.string("ROLE_ID"), null);

	const event = {
		event: "incident_notification_created",
		incident_id: incident.id,
		incident_name: incident.name,
		incident_status: incident.status,
		incident_impact: incident.impact,
		incident_components_count: incident.components.length,
		incident_updates_count: incident.incident_updates.length,
		role_tagged: roleId !== null,
		service: "discord-status-webhook",
		start_timestamp: new Date().toISOString(),
	};

	try {
		const message = yield* webhook.send({
			params: { wait: true },
			payload: {
				content: roleId ? `<@&${roleId}>` : undefined,
				allowed_mentions: { roles: roleId ? [roleId] : [] },
				embeds: [createEmbed(statusData, incident)],
			},
		});

		const drizzle = yield* Drizzle;
		yield* drizzle.use((db) =>
			db.insert(discordStatus).values({
				incidentId: incident.id,
				messageId: message.id,
				status: incident.status,
				updateId: incident.incident_updates[0].id,
			}),
		);

		yield* Effect.logInfo({
			...event,
			outcome: "success",
			duration_ms: Date.now() - startTime,
			discord_message_id: message.id,
			discord_update_id: incident.incident_updates[0].id,
		});
	} catch (error) {
		const errorInfo =
			error instanceof Error
				? {
						type: error.constructor.name,
						message: error.message,
					}
				: {
						type: "UnknownError",
						message: String(error),
					};

		yield* Effect.logError({
			...event,
			outcome: "error",
			duration_ms: Date.now() - startTime,
			error: {
				...errorInfo,
				retriable: false,
			},
		});
		return yield* Effect.fail(new WebhookError({ cause: error }));
	}
});

export const updateStatus = Effect.fn("updateStatus")(function* (
	saved: typeof discordStatus.$inferSelect,
	incident: IncidentSchemaType,
) {
	const startTime = Date.now();
	const webhook = yield* Webhook;
	const statusData = yield* StatusConfig;

	const event = {
		event: "incident_notification_updated",
		incident_id: incident.id,
		incident_name: incident.name,
		incident_status: incident.status,
		incident_impact: incident.impact,
		previous_status: saved.status,
		previous_update_id: saved.updateId,
		new_update_id: incident.incident_updates[0].id,
		discord_message_id: saved.messageId,
		service: "discord-status-webhook",
		start_timestamp: new Date().toISOString(),
	};

	try {
		yield* webhook.editMessage(saved.messageId, {
			payload: { embeds: [createEmbed(statusData, incident)] },
		});

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

		yield* Effect.logInfo({
			...event,
			outcome: "success",
			duration_ms: Date.now() - startTime,
		});
	} catch (error) {
		const errorInfo =
			error instanceof Error
				? {
						type: error.constructor.name,
						message: error.message,
					}
				: {
						type: "UnknownError",
						message: String(error),
					};

		yield* Effect.logError({
			...event,
			outcome: "error",
			duration_ms: Date.now() - startTime,
			error: {
				...errorInfo,
				retriable: true,
			},
		});
		return yield* Effect.fail(new WebhookError({ cause: error }));
	}
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
