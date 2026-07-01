import "./lib/env";
import "./lib/db/migrate";
import "./server";
import "./cron";
import "./warnings";

process.on("SIGINT", () => process.exit(0));
process.on("SIGTERM", () => process.exit(0));
