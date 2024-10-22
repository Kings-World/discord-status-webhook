import { createServer } from "node:http2";
import { serve } from "@hono/node-server";
import { type Context, Hono } from "hono";
import type { StatusCode } from "hono/utils/http-status";
import { z } from "zod";
import { fromZodError } from "zod-validation-error";
import { logger } from "../constants.js";
import { processDiscordIncident } from "../functions/processIncident.js";
import { componentUpdateWebhookSchema, incidentWebhookSchema } from "../zod.js";

logger.info("Server: Creating the Hono server");

const app = new Hono();

app.get("/", async (c) => {
    const body = await c.req.json();
    if (!body) return out(c, false, "No body provided.", 422);

    const parsed = z.union([incidentWebhookSchema, componentUpdateWebhookSchema]).safeParse(body);

    if (!parsed.success) {
        const reason = fromZodError(parsed.error);
        logger.error(`Hono: Failed to parse the body with reason: ${reason}`);
        return out(c, false, reason.toString(), 422);
    }

    if ("component" in parsed.data) {
        const { id, name } = body.data.component;
        const { old_status, new_status, component_type } = body.data.component_update;

        logger.info(`Hono[${id}] The ${name} ${component_type} updated from ${old_status} to ${new_status}`);

        return out(c, true, "Processed component update", 200);
    }

    await processDiscordIncident(parsed.data.incident);

    return out(c, true, "Processed incident", 200);
});

app.onError((error, c) => {
    logger.error("Hono: An error occurred", error);
    return out(c, false, "Something went wrong.", 500);
});

app.notFound((c) => {
    return out(c, false, "Page not found.", 404);
});

export function startServer() {
    logger.info("Server: Starting the Hono server");
    serve({ fetch: app.fetch, createServer }, (info) => {
        logger.info(`Hono: Listening on ${info.address}:${info.port}`);
    });
}

function out<C extends Context, S extends StatusCode>(c: C, success: boolean, message: string, status: S) {
    return c.json({ success, message }, status);
}
