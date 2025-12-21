import { Config } from "effect";
import type { IncidentStatusType } from "./schema.js";

export const incidentsJsonUrl =
	"https://discordstatus.com/api/v2/incidents.json";

export const Emojis = Config.all({
	identifiedStatusEmoji: Config.string("IDENTIFIED_STATUS_EMOJI"),
	investigatingStatusEmoji: Config.string("INVESTIGATING_STATUS_EMOJI"),
	monitoringStatusEmoji: Config.string("MONITORING_STATUS_EMOJI"),
	resolvedStatusEmoji: Config.string("RESOLVED_STATUS_EMOJI"),
});

export const StatusConfig = Config.map(
	Emojis,
	(env) =>
		({
			identified: [0xf15832, env.identifiedStatusEmoji],
			investigating: [0xed9932, env.investigatingStatusEmoji],
			monitoring: [0xf2ef42, env.monitoringStatusEmoji],
			resolved: [0x43b582, env.resolvedStatusEmoji],
			postmortem: [0x43b582, env.resolvedStatusEmoji],
		}) satisfies StatusData,
);

export type StatusData = Record<
	IncidentStatusType,
	[color: number, emoji: string]
>;
