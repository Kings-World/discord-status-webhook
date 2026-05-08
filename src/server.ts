import { Elysia } from "elysia";
import { logger } from "./lib/constants";
import { processDiscordIncident } from "./lib/functions/processDiscordIncident";
import { webhookPostRequestSchema } from "./lib/zod";

const app = new Elysia()
	.onAfterResponse(async (ctx) => {
		logger.info(
			`Elysia: ${ctx.set.status} ${ctx.request.method} ${ctx.path}`,
		);
	})
	.get("/", () => "Nothing to see here")
	.post(
		"/",
		async ({ body }) => {
			if ("component" in body) {
				const { id, name } = body.component;
				const { old_status, new_status, component_type } =
					body.component_update;

				logger.info(
					`DiscordComponent[${id}] The ${name} ${component_type} updated from ${old_status} to ${new_status}`,
				);

				return "Processed component update";
			}

			await processDiscordIncident(body.incident);

			return "Processed incident update";
		},
		{
			body: webhookPostRequestSchema,
		},
	)
	.listen(3000);

logger.info(
	`🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`,
);
