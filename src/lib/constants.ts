import { env } from "./env";
import { Logger } from "./logger";
import type { IncidentStatusEnum } from "./zod";

export const incidentsJsonUrl =
	"https://discordstatus.com/api/v2/incidents.json";

export const statusColors: Record<IncidentStatusEnum, number> = {
	identified: 0xf15832,
	investigating: 0xed9932,
	monitoring: 0xf2ef42,
	resolved: 0x43b582,
	postmortem: 0x43b582,
};

export const statusEmojis: Record<IncidentStatusEnum, string | undefined> = {
	identified: env.IDENTIFIED_STATUS_EMOJI,
	investigating: env.INVESTIGATING_STATUS_EMOJI,
	monitoring: env.MONITORING_STATUS_EMOJI,
	resolved: env.RESOLVED_STATUS_EMOJI,
	postmortem: env.RESOLVED_STATUS_EMOJI,
};

export const logger = new Logger();
