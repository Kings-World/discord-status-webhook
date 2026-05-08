import ky, { isHTTPError, isTimeoutError } from "ky";
import { prettifyError } from "zod";
import { incidentsJsonUrl, logger } from "../constants";
import { incidentsRequestSchema } from "../zod";
import { processDiscordIncident } from "./processDiscordIncident";

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
		if (isTimeoutError(error)) {
			return logger.warn(
				"The request to fetch incidents timed out. Will retry next time.",
			);
		}

		if (isHTTPError(error)) {
			return logger.warn(
				`The request to fetch incidents failed with status ${error.response.status} (${error.message}). Will retry next time.`,
			);
		}

		logger.error(
			"Something went wrong while fetching the incidents",
			error,
		);
	}
}
