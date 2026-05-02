import {
	FetchHttpClient,
	HttpClient,
	HttpClientRequest,
} from "@effect/platform";
import { make } from "dfx/DiscordREST/Generated";
import { Effect } from "effect";

export const useRest = Effect.gen(function* () {
	const startTime = Date.now();
	const event = {
		event: "discord_api_client_created",
		service: "discord-status-webhook",
		api_base_url: "https://discord.com/api/v10",
		start_timestamp: new Date().toISOString(),
	};

	try {
		const client = yield* HttpClient.HttpClient;

		const httpClient = HttpClient.mapRequestInputEffect(client, (req) =>
			Effect.sync(() => {
				return req.pipe(
					HttpClientRequest.prependUrl("https://discord.com/api/v10"),
				);
			}),
		);

		const rest = make(httpClient);

		yield* Effect.logInfo({
			...event,
			outcome: "success",
			duration_ms: Date.now() - startTime,
		});

		return yield* Effect.succeed(rest);
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

		return yield* Effect.fail(error);
	}
}).pipe(Effect.provide(FetchHttpClient.layer));
