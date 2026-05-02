import ky, { isTimeoutError } from "ky";
import { prettifyError } from "zod";
import { incidentsJsonUrl } from "../constants.js";
import { incidentsRequestSchema } from "../zod.js";
import { processDiscordIncident } from "./processDiscordIncident.js";

export async function checkApi() {
	try {
		const body = await ky.get(incidentsJsonUrl).json();
		const parsed = incidentsRequestSchema.safeParse(body);

		if (!parsed.success) {
			console.error(
				`Failed to parse request body with reason:\n${prettifyError(parsed.error)}`,
			);
			return;
		}

		for (const incident of parsed.data.incidents.toReversed()) {
			await processDiscordIncident(incident);
		}
	} catch (error) {
		if (isTimeoutError(error)) {
			return console.warn(
				"The request to fetch incidents timed out, skipping...",
			);
		}

		console.error(
			"Something went wrong while fetching the incidents",
			error,
		);
	}
}
