import { CronJob } from "cron";
import { logger } from "../constants.js";
import { checkApi } from "../functions/checkApi.js";

logger.info("Cron: Creating the cron job");

const cronJob = CronJob.from({
	cronTime: "*/5 * * * *",
	start: false,
	onTick: () => {
		logger.debug("Cron: Cron job started ticking");
		void checkApi();
	},
	onComplete: () => {
		logger.debug("Cron: Cron job completed");
	},
});

for (const event of ["SIGINT", "SIGTERM"] as NodeJS.Signals[]) {
	process.on(event, async (signal) => {
		logger.info(`Shutdown: Received the ${signal} signal`);
		cronJob.stop();
		process.exit(0);
	});
}

export function startCronJob() {
	logger.info("Cron: Starting the cron job");
	cronJob.start();
}
