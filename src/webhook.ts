import { WebhookClient } from "discord.js";
import { Config, Context, Data, Effect, Layer, Redacted } from "effect";

export class WebhookError extends Data.TaggedError("WebhookError")<{
	cause?: unknown;
	message?: string;
}> {}

interface WebhookImpl {
	use: <T>(
		fn: (client: WebhookClient) => T,
	) => Effect.Effect<Awaited<T>, WebhookError, never>;
}

export class Webhook extends Context.Tag("discord-status-webhook/webhook")<
	Webhook,
	WebhookImpl
>() {}

export const make = (...params: ConstructorParameters<typeof WebhookClient>) =>
	Effect.gen(function* () {
		const client = yield* Effect.try({
			try: () => new WebhookClient(...params),
			catch: (error) => new WebhookError({ cause: error }),
		});

		return Webhook.of({
			use: (fn) =>
				Effect.gen(function* () {
					const result = yield* Effect.try({
						try: () => fn(client),
						catch: (error) =>
							new WebhookError({
								cause: error,
								message: "Synchronous error in `Webhook.use`",
							}),
					});

					if (result instanceof Promise) {
						return yield* Effect.tryPromise({
							try: () => result,
							catch: (error) =>
								new WebhookError({
									cause: error,
									message:
										"Asynchronous error in `Webhook.use`",
								}),
						});
					}

					return result;
				}),
		});
	});

export const fromEnv = Layer.scoped(
	Webhook,
	Effect.gen(function* () {
		yield* Effect.logInfo("Creating the webhook client");
		const webhookId = yield* Config.string("WEBHOOK_ID");
		const webhookToken = yield* Config.redacted("WEBHOOK_TOKEN");

		return yield* make({
			id: webhookId,
			token: Redacted.value(webhookToken),
		});
	}),
);
