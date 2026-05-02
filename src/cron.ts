import { checkApi } from "./lib/functions/checkApi";

Bun.cron("*/5 * * * *", () => {
	console.log("Cron job started ticking");
	void checkApi();
	console.log("Cron job completed");
});

console.log("Cron job scheduled to run every 5 minutes");
