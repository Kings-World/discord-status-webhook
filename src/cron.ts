import {
	FetchHttpClient,
	HttpClient,
	HttpClientError,
	HttpClientResponse,
} from "@effect/platform";
import { Cron, Effect, Layer, Schedule } from "effect";
import { incidentsJsonUrl } from "./constants.js";
import { processIncident } from "./process.js";
import { IncidentsRequestSchema } from "./schema.js";

const cron = Cron.unsafeParse("*/5 * * * *");

export const CronJobGen = Effect.gen(function* () {
	const startTime = Date.now();
	const client = yield* HttpClient.HttpClient;

	const event = {
		event: "incident_sync_job",
		service: "discord-status-webhook",
		source_url: incidentsJsonUrl,
		start_timestamp: new Date().toISOString(),
	};

	try {
		const response = yield* client.get(incidentsJsonUrl);

		const json = yield* HttpClientResponse.matchStatus(response, {
			"2xx": HttpClientResponse.schemaBodyJson(IncidentsRequestSchema),
			orElse: (res) =>
				new HttpClientError.ResponseError({
					reason: "StatusCode",
					request: res.request,
					response: res,
				}),
		});

		const incidents = json.incidents.toReversed();
		let processed = 0;
		const created = 0;
		const updated = 0;
		let errors = 0;

		for (const incident of incidents) {
			try {
				yield* processIncident(incident);
				processed++;

				// We'd need to track if it was created or updated, but for now just count processed
			} catch (error) {
				errors++;
				yield* Effect.logWarning({
					...event,
					incident_id: incident.id,
					incident_name: incident.name,
					outcome: "processing_failed",
					error: {
						type:
							error instanceof Error
								? error.constructor.name
								: "UnknownError",
						message:
							error instanceof Error
								? error.message
								: String(error),
					},
				});
			}
		}

		yield* Effect.logInfo({
			...event,
			outcome: "success",
			duration_ms: Date.now() - startTime,
			total_incidents: incidents.length,
			processed_incidents: processed,
			created_notifications: created,
			updated_notifications: updated,
			processing_errors: errors,
			next_run: new Date(Date.now() + 5 * 60 * 1000).toISOString(), // 5 minutes from now
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
	}
}).pipe(
	Effect.provide(FetchHttpClient.layer),
	Effect.repeat(Schedule.cron(cron)),
);

export const CronJobService = Layer.scopedDiscard(CronJobGen);
