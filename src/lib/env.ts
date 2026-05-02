import { z } from "zod";

export const envSchema = z.object({
	DATABASE_URL: z.string(),
	WEBHOOK_ID: z.string(),
	WEBHOOK_TOKEN: z.string(),
	ROLE_ID: z.string().optional(),
	IDENTIFIED_STATUS_EMOJI: z.string().optional(),
	INVESTIGATING_STATUS_EMOJI: z.string().optional(),
	MONITORING_STATUS_EMOJI: z.string().optional(),
	RESOLVED_STATUS_EMOJI: z.string().optional(),
});

export const env = envSchema.parse(process.env);
