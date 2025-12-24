import { toTitleCase } from "@sapphire/utilities";
import { EmbedBuilder, time } from "discord.js";
import { Data, Effect } from "effect";
import type { StatusData } from "./constants.js";
import type { IncidentSchemaType } from "./schema.js";

export class EmbedError extends Data.TaggedError("EmbedError")<{
	cause?: unknown;
	message?: string;
}> {}

export const createEmbed = (
	statusData: StatusData,
	incident: IncidentSchemaType,
) =>
	Effect.try({
		try: () =>
			new EmbedBuilder()
				.setTitle(incident.name)
				.setURL(incident.shortlink.toString())
				.setFooter({ text: "Started" })
				.setTimestamp(incident.started_at)
				.setColor(statusData[incident.status][0])
				.setAuthor({
					name: "Discord Status",
					iconURL:
						"https://discord.com/assets/f9bb9c4af2b9c32a2c5ee0014661546d.png",
				})
				.setFields(
					incident.incident_updates.toReversed().map((update) => ({
						name: `<:${update.status}:${statusData[update.status][1]}> ${toTitleCase(update.status)} (${time(update.created_at, "R")})`,
						value: update.body,
					})),
				),
		catch: (error) => new EmbedError({ cause: error }),
	});
