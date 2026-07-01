import { API } from "@discordjs/core/http-only";
import { REST } from "@discordjs/rest";
import { env } from "./env";
import { createEmbed } from "./functions/createEmbed";
import type { IncidentSchema } from "./zod";

export const rest = new REST({ version: "10" });
export const api = new API(rest);

export function sendWebhookMessage(incident: IncidentSchema) {
	return api.webhooks.execute(env.WEBHOOK_ID, env.WEBHOOK_TOKEN, {
		content: env.ROLE_ID && `<@&${env.ROLE_ID}>`,
		allowed_mentions: { roles: env.ROLE_ID ? [env.ROLE_ID] : [] },
		embeds: [createEmbed(incident)],
		wait: true,
	});
}

export function editWebhookMessage(
	messageId: string,
	incident: IncidentSchema,
) {
	return api.webhooks.editMessage(
		env.WEBHOOK_ID,
		env.WEBHOOK_TOKEN,
		messageId,
		{ embeds: [createEmbed(incident)] },
	);
}
