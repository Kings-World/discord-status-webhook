import "./lib/env";
// import "./lib/db/migrate";
import "./server";
import "./cron";

process.on("SIGINT", () => {
	console.log("Shutting down gracefully...");
	process.exit(0);
});
