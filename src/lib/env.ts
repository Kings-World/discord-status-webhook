import { z } from "zod";

const snowflakeSchema = z
	.string()
	.regex(/^\d{17,20}$/, "Snowflakes are 17-20 digits long");

export const envSchema = z.object({
	DATABASE_URL: z.url({
		protocol: /^postgresql$/,
		message: "Only PostgreSQL databases are supported",
	}),
	WEBHOOK_ID: snowflakeSchema,
	WEBHOOK_TOKEN: z.string().regex(/^[\w-]+$/),
	ROLE_ID: optional(snowflakeSchema),
	IDENTIFIED_STATUS_EMOJI: optional(snowflakeSchema),
	INVESTIGATING_STATUS_EMOJI: optional(snowflakeSchema),
	MONITORING_STATUS_EMOJI: optional(snowflakeSchema),
	RESOLVED_STATUS_EMOJI: optional(snowflakeSchema),
	DEBUG: z.stringbool().optional(),
	UPDATES_EDIT_MESSAGE: z.stringbool().default(true),
});

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
	console.error("Environment variable validation failed: ");
	console.log(z.prettifyError(parsed.error));
	process.exit(1);
}

export const env = parsed.data;

function optional<Output>(type: z.ZodType<Output>) {
	return z.preprocess((val) => val || undefined, type.optional());
}
