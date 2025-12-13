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
	const client = yield* HttpClient.HttpClient;

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

	for (const incident of json.incidents.toReversed()) {
		yield* processIncident(incident);
	}

	yield* Effect.logInfo("The cron job ran successfully");
}).pipe(
	Effect.provide(FetchHttpClient.layer),
	Effect.repeat(Schedule.cron(cron)),
	Effect.catchAll((error) =>
		Effect.logError(
			"Something went wrong during cron execution",
			Error.isError(error) ? error.message : error,
		),
	),
);

export const CronJobService = Layer.scopedDiscard(CronJobGen);
