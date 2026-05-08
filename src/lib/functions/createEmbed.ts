import type { APIEmbed } from "@discordjs/core/http-only";
import { time } from "@discordjs/formatters";
import { toTitleCase } from "@sapphire/utilities";
import { statusColors, statusEmojis } from "../constants";
import type { IncidentSchema } from "../zod";

export function createEmbed(incident: IncidentSchema): APIEmbed {
	return {
		title: incident.name,
		url: incident.shortlink,
		footer: { text: "Started" },
		timestamp: incident.started_at.toISOString(),
		color: statusColors[incident.status],
		author: {
			name: "Discord Status",
			icon_url:
				"https://discord.com/assets/f9bb9c4af2b9c32a2c5ee0014661546d.png",
		},
		fields: incident.incident_updates.toReversed().map((update) => {
			const emojiId = statusEmojis[update.status];
			const title = `${toTitleCase(update.status)} (${time(update.created_at, "R")})`;

			return {
				name: emojiId
					? `<:${update.status}:${emojiId}> ${title}`
					: title,
				value: update.body,
			};
		}),
	};
}
