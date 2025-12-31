import type { DiscordRest } from "dfx/DiscordREST/Generated";
import { Config, Context, Data, Effect, Layer, Redacted } from "effect";
import { useRest } from "./rest.js";

type ExecuteWebhookFn = DiscordRest["executeWebhook"];
type UpdateWebhookMessageFn = DiscordRest["updateWebhookMessage"];

export class WebhookError extends Data.TaggedError("WebhookError")<{
	cause?: unknown;
	message?: string;
}> {}

interface WebhookImpl {
	send: (
		options: Parameters<ExecuteWebhookFn>[2],
	) => ReturnType<ExecuteWebhookFn>;
	editMessage: (
		messageId: string,
		options: Parameters<UpdateWebhookMessageFn>[3],
	) => ReturnType<UpdateWebhookMessageFn>;
}

export class Webhook extends Context.Tag("discord-status-webhook/webhook")<
	Webhook,
	WebhookImpl
>() {}

export const make = (
	webhookId: string,
	webhookToken: Redacted.Redacted<string>,
) =>
	Effect.gen(function* () {
		const rest = yield* useRest;

		return Webhook.of({
			send: (options) =>
				rest
					.executeWebhook(
						webhookId,
						Redacted.value(webhookToken),
						options,
					)
					.pipe(Effect.withSpan("webhook.send")),
			editMessage: (messageId, options) =>
				rest
					.updateWebhookMessage(
						webhookId,
						Redacted.value(webhookToken),
						messageId,
						options,
					)
					.pipe(Effect.withSpan("webhook.editMessage")),
		});
	});

export const fromEnv = Layer.scoped(
	Webhook,
	Effect.gen(function* () {
		yield* Effect.logInfo("Creating the webhook instance");
		const webhookId = yield* Config.string("WEBHOOK_ID");
		const webhookToken = yield* Config.redacted("WEBHOOK_TOKEN");

		return yield* make(webhookId, webhookToken);
	}),
);
