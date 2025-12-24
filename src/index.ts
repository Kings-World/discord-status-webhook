import "@skyra/env-utilities/setup";
import { DevTools } from "@effect/experimental/index";
import { NodeRuntime } from "@effect/platform-node";
import { Effect, Layer } from "effect";
import { CronJobService } from "./cron.js";
import * as Drizzle from "./db/drizzle.js";
import { ServerLive } from "./http.js";
import * as Webhook from "./webhook.js";

export const MainLive = Layer.mergeAll(
	Drizzle.fromEnv,
	Webhook.fromEnv,
	DevTools.layer(),
);

const Services = Layer.mergeAll(CronJobService, ServerLive);

NodeRuntime.runMain(Layer.launch(Services).pipe(Effect.provide(MainLive)));
