import { Elysia } from "elysia";
import { processDiscordIncident } from "./lib/functions/processDiscordIncident";
import { webhookPostRequestSchema } from "./lib/zod";

const app = new Elysia()
	.onAfterResponse(async (ctx) => {
		// ctx.url exists but ctx.request.url likes to be an empty string
		const url = "url" in ctx ? ctx.url : ctx.request.url || ctx.route;
		console.log(`${ctx.set.status} ${ctx.request.method} ${url}`);
	})
	.get("/", () => "Nothing to see here")
	.post(
		"/",
		async ({ body }) => {
			if ("component" in body) {
				const { id, name } = body.component;
				const { old_status, new_status, component_type } =
					body.component_update;

				console.log(
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

console.log(
	`🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`,
);
