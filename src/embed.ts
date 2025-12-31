import { time } from "@discordjs/formatters";
import { toTitleCase } from "@sapphire/utilities";
import type { RichEmbed } from "dfx/DiscordREST/Generated";
import type { StatusData } from "./constants.js";
import type { IncidentSchemaType } from "./schema.js";

export const createEmbed = (
	statusData: StatusData,
	incident: IncidentSchemaType,
) =>
	({
		title: incident.name,
		url: incident.shortlink.toString(),
		footer: { text: "Started" },
		timestamp: incident.started_at.toISOString(),
		color: statusData[incident.status][0],
		author: {
			name: "Discord Status",
			icon_url:
				"https://discord.com/assets/f9bb9c4af2b9c32a2c5ee0014661546d.png",
		},
		fields: incident.incident_updates.toReversed().map((update) => ({
			name: `<:${update.status}:${statusData[update.status][1]}> ${toTitleCase(update.status)} (${time(update.created_at, "R")})`,
			value: update.body,
		})),
	}) satisfies RichEmbed;
