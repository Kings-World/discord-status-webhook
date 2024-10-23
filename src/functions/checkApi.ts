import ky from "ky";
import { fromZodError } from "zod-validation-error";
import { incidentsJsonUrl, logger } from "../constants.js";
import { incidentsRequestSchema } from "../zod.js";
import { processDiscordIncident } from "./processIncident.js";

export async function checkApi() {
    try {
        const body = await ky.get(incidentsJsonUrl).json();
        const parsed = incidentsRequestSchema.safeParse(body);

        if (!parsed.success) {
            const formatted = fromZodError(parsed.error);
            logger.error(
                `Failed to parse request body with reason: ${formatted.message}`,
            );
            return;
        }

        for (const incident of parsed.data.incidents.slice(0, 5).reverse()) {
            await processDiscordIncident(incident);
        }
    } catch (error) {
        logger.error(
            "Something went wrong while fetching the incidents",
            error,
        );
    }
}
