import {
	FetchHttpClient,
	HttpClient,
	HttpClientRequest,
} from "@effect/platform";
import { make } from "dfx/DiscordREST/Generated";
import { Effect } from "effect";

export const useRest = Effect.gen(function* () {
	yield* Effect.logInfo("Creating the HTTP client for the Discord API");
	const client = yield* HttpClient.HttpClient;

	const httpClient = HttpClient.mapRequestInputEffect(client, (req) =>
		Effect.sync(() => {
			return req.pipe(
				HttpClientRequest.prependUrl("https://discord.com/api/v10"),
			);
		}),
	);

	//
	return yield* Effect.succeed(make(httpClient));
}).pipe(Effect.provide(FetchHttpClient.layer));
