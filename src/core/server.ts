import { serve } from "@hono/node-server";
import { type Context, Hono } from "hono";
import { logger as loggerMiddleware } from "hono/logger";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import { z } from "zod";
import { logger } from "../constants.js";
import { processDiscordIncident } from "../functions/processIncident.js";
import { componentUpdateWebhookSchema, incidentWebhookSchema } from "../zod.js";

logger.info("Server: Creating the Hono server");

const app = new Hono();

app.use(
    loggerMiddleware((str, ...rest) =>
        logger.info(`Hono[logger] ${str}`, ...rest),
    ),
);

app.get("/", (c) => out(c, true, "Nothing to see here.", 200));

app.post("/", async (c) => {
    const body = await c.req.json();
    if (!body) return out(c, false, "No body provided.", 422);

    const parsed = z
        .union([incidentWebhookSchema, componentUpdateWebhookSchema])
        .safeParse(body);

    if (!parsed.success) {
        const reason = z.prettifyError(parsed.error);
        logger.error(`Zod: Failed to parse the body with reason:\n${reason}`);
        return out(c, false, reason.toString(), 422);
    }

    if ("component" in parsed.data) {
        const { id, name } = parsed.data.component;
        const { old_status, new_status, component_type } =
            parsed.data.component_update;

        logger.info(
            `DiscordComponent[${id}] The ${name} ${component_type} updated from ${old_status} to ${new_status}`,
        );

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
    serve(app, (info) => {
        logger.info(`Hono: Listening on ${info.address}:${info.port}`);
    });
}

function out<C extends Context, S extends ContentfulStatusCode>(
    c: C,
    success: boolean,
    message: string,
    status: S,
) {
    return c.json({ success, message }, status);
}
