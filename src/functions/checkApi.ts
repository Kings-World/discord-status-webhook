import ky from "ky";
import { prettifyError } from "zod";
import { incidentsJsonUrl, logger } from "../constants.js";
import { incidentsRequestSchema } from "../zod.js";
import { processDiscordIncident } from "./processIncident.js";

export async function checkApi() {
	try {
		const body = await ky.get(incidentsJsonUrl).json();
		const parsed = incidentsRequestSchema.safeParse(body);

		if (!parsed.success) {
			logger.error(
				`Failed to parse request body with reason:\n${prettifyError(parsed.error)}`,
			);
			return;
		}

		for (const incident of parsed.data.incidents.toReversed()) {
			await processDiscordIncident(incident);
		}
	} catch (error) {
		logger.error(
			"Something went wrong while fetching the incidents",
			error,
		);
	}
}
