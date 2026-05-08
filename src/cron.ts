import { logger } from "./lib/constants";
import { checkApi } from "./lib/functions/checkApi";

Bun.cron("* * * * *", () => {
	logger.debug("Cron job started ticking");
	void checkApi();
});

logger.info("The Cron job is scheduled to run every 5 minutes");
