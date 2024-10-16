import "dotenv/config";
import "@skyra/env-utilities";

import { CronJob } from "cron";
import { logger } from "./constants.js";
import { checkApi } from "./functions/checkApi.js";

logger.info("Starting the cron job");

const cronJob = CronJob.from({
    cronTime: "*/5 * * * *",
    onTick: () => {
        logger.debug("Cron job started ticking");
        void checkApi();
    },
    onComplete: () => {
        logger.debug("Cron job completed");
    },
});

for (const event of ["SIGINT", "SIGTERM"] as NodeJS.Signals[]) {
    process.on(event, async (signal) => {
        logger.info(`Shutdown: Received the ${signal} signal`);
        cronJob.stop();
        process.exit(0);
    });
}

declare module "@skyra/env-utilities" {
    interface Env {
        DATABASE_URL: string;
        WEBHOOK_ID: string;
        WEBHOOK_TOKEN: string;
        ROLE_ID: string;
        IDENTIFIED_STATUS_EMOJI: string;
        INVESTIGATING_STATUS_EMOJI: string;
        MONITORING_STATUS_EMOJI: string;
        RESOLVED_STATUS_EMOJI: string;
    }
}
