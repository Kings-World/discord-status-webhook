import { logger } from "./lib/constants";
import { env } from "./lib/env";

if (env.DEBUG) {
	logger.warn(
		"Debug mode is enabled. This is not recommended for production environments.",
	);
}

if (!env.UPDATES_EDIT_MESSAGE) {
	logger.warn(
		"Status updates will be sent as new messages instead of editing the existing message.",
	);
}
