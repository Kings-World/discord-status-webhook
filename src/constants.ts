import { LogLevel } from "@sapphire/framework";
import { Logger } from "@sapphire/plugin-logger";
import { envIsDefined, envParseString } from "@skyra/env-utilities";
import { WebhookClient } from "discord.js";
import type { z } from "zod";
import type { incidentStatusEnum } from "./zod.js";

export const incidentsJsonUrl =
    "https://discordstatus.com/api/v2/incidents.json";

export const logger = new Logger({ level: LogLevel.Debug });

export const statusData: Record<
    z.infer<typeof incidentStatusEnum>,
    [color: number, emoji: string]
> = {
    identified: [0xf15832, envParseString("IDENTIFIED_STATUS_EMOJI")],
    investigating: [0xed9932, envParseString("INVESTIGATING_STATUS_EMOJI")],
    monitoring: [0xf2ef42, envParseString("MONITORING_STATUS_EMOJI")],
    resolved: [0x43b582, envParseString("RESOLVED_STATUS_EMOJI")],
    postmortem: [0x43b582, envParseString("RESOLVED_STATUS_EMOJI")],
};

export const webhook = envIsDefined("WEBHOOK_ID", "WEBHOOK_TOKEN")
    ? new WebhookClient({
          id: envParseString("WEBHOOK_ID"),
          token: envParseString("WEBHOOK_TOKEN"),
      })
    : null;

export const roleId = envIsDefined("ROLE_ID")
    ? envParseString("ROLE_ID")
    : null;
