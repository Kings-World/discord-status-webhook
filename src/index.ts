import "@skyra/env-utilities/setup";
import { startCronJob } from "./core/cron.js";
import { startServer } from "./core/server.js";

startCronJob();
startServer();

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
