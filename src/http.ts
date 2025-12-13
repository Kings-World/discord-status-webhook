import { createServer } from "node:http";
import {
	HttpApi,
	HttpApiBuilder,
	HttpApiEndpoint,
	HttpApiGroup,
	HttpMiddleware,
	HttpServer,
} from "@effect/platform";
import { NodeHttpServer } from "@effect/platform-node";
import { Effect, Layer, Option, Schema } from "effect";
import { MainLive } from ".";
import { processIncident } from "./process";
import { WebhookPayloadSchema } from "./schema";

const Api = HttpApi.make("Webhook").add(
	HttpApiGroup.make("Routes")
		.add(HttpApiEndpoint.get("route")`/`.addSuccess(Schema.String))
		.add(
			HttpApiEndpoint.post("webhook")`/`
				.setPayload(WebhookPayloadSchema)
				.addSuccess(Schema.String),
		),
);

const RoutesLive = HttpApiBuilder.group(Api, "Routes", (handlers) =>
	handlers
		.handle("route", () => Effect.succeed("Nothing to see here."))
		.handle("webhook", ({ payload }) =>
			Effect.gen(function* () {
				if ("component" in payload) {
					const { id, name } = payload.component;
					const { component_type, old_status, new_status } =
						payload.component_update;
					yield* Effect.logInfo(
						`The ${name} (${id}) ${component_type} updated from ${old_status} to ${new_status}`,
					);
					return Effect.succeed(
						"The component update has been processed",
					);
				}

				yield* processIncident(payload.incident);

				return Effect.succeed("The incident has been processed");
			}).pipe(
				Effect.provide(MainLive),
				Effect.catchAll((error) => Effect.fail(error)),
			),
		),
);

const ApiLive = HttpApiBuilder.api(Api).pipe(Layer.provide(RoutesLive));

export const ServerLive = HttpApiBuilder.serve(HttpMiddleware.logger).pipe(
	Layer.provide(ApiLive),
	HttpServer.withLogAddress,
	Layer.provide(NodeHttpServer.layer(createServer, { port: 3000 })),
);
