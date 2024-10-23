import { LogLevel } from "@sapphire/framework";
import { Logger } from "@sapphire/plugin-logger";
import { envIsDefined, envParseString } from "@skyra/env-utilities";
import { WebhookClient } from "discord.js";
import type { z } from "zod";
import type { incidentStatusEnum } from "./zod.js";

export const incidentsJsonUrl =
    "https://srhpyqt94yxb.statuspage.io/api/v2/incidents.json";

export const logger = new Logger({ level: LogLevel.Debug });

export const statusData: Record<
    z.infer<typeof incidentStatusEnum> | string,
    [color: number, emoji: string]
> = {
    identified: [0xf15832, envParseString("IDENTIFIED_STATUS_EMOJI")], // hsl(12, 87.2%, 57.1%) - red
    investigating: [0xed9932, envParseString("INVESTIGATING_STATUS_EMOJI")], // hsl(33, 83.9%, 56.3%) - orange
    monitoring: [0xf2ef42, envParseString("MONITORING_STATUS_EMOJI")], // hsl(59, 87.1%, 60.4%) - yellow
    resolved: [0x43b582, envParseString("RESOLVED_STATUS_EMOJI")], // hsl(153, 46%, 48.6%) - green
    postmortem: [0x43b582, envParseString("RESOLVED_STATUS_EMOJI")], // hsl(153, 46%, 48.6%) - green
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
