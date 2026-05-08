import { join } from "node:path";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { logger } from "../constants";
import { env } from "../env";

const db = drizzle(env.DATABASE_URL);

logger.info("Running database migrations...");

try {
	await migrate(db, {
		migrationsFolder: join(process.cwd(), "migrations"),
	});
} catch (error) {
	if (Error.isError(error) && error.cause && Error.isError(error.cause)) {
		if ("code" in error.cause && error.cause.code === "ECONNREFUSED") {
			logger.error(
				"Failed to connect to the database: connection refused",
			);
			process.exit(1);
		}
	}

	// purposefully ignoring errors because drizzle throws
	// even when migrations are up to date
}

logger.info("Database migrations completed.");
