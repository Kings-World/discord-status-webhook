import {
	API,
	type CreateWebhookMessageOptions,
	type EditWebhookMessageOptions,
} from "@discordjs/core/http-only";
import { REST } from "@discordjs/rest";
import { env } from "./env";

export const rest = new REST({ version: "10" });
export const api = new API(rest);

export function sendWebhookMessage(body: SendWebhookMessageOptions) {
	return api.webhooks.execute(env.WEBHOOK_ID, env.WEBHOOK_TOKEN, body);
}

export function editWebhookMessage(
	messageId: string,
	body: EditWebhookMessageOptions,
) {
	return api.webhooks.editMessage(
		env.WEBHOOK_ID,
		env.WEBHOOK_TOKEN,
		messageId,
		body,
	);
}

export type SendWebhookMessageOptions = CreateWebhookMessageOptions & {
	wait: true;
};
