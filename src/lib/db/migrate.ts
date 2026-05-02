import { join } from "node:path";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { env } from "../env.js";

const db = drizzle(env.DATABASE_URL);

console.log("Running database migrations...");

try {
	await migrate(db, {
		migrationsFolder: join(process.cwd(), "migrations"),
	});
} catch {
	/*
	if (Error.isError(error)) {
		console.error("Error running database migrations:", error.message);
	}
	process.exit(1);
	*/
}

console.log("Database migrations completed.");
