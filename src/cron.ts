import { checkApi } from "./lib/functions/checkApi";

Bun.cron("*/5 * * * *", () => {
	if (Bun.env["DEBUG"] === "true") console.log("Cron job started ticking");
	void checkApi();
});

console.log("Cron job scheduled to run every 5 minutes");
