import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { Config, Context, Data, Effect, Layer, Redacted } from "effect";
import postgres from "postgres";
import * as schema from "./schema.js";

export class DrizzleError extends Data.TaggedError("DrizzleError")<{
	cause?: unknown;
	message?: string;
	operation?: "connect" | "migrate" | "query";
}> {}

interface DatabaseConfig {
	readonly url: Redacted.Redacted<string>;
	readonly maxConnections?: number;
	readonly idleTimeout?: number;
	readonly connectTimeout?: number;
}

type DrizzleImpl = {
	readonly use: <T>(
		fn: (db: ReturnType<typeof drizzle<typeof schema>>) => Promise<T> | T,
	) => Effect.Effect<T, DrizzleError, never>;
	readonly transaction: <T>(
		fn: (tx: any) => Promise<T>,
	) => Effect.Effect<T, DrizzleError, never>;
};

export class Drizzle extends Context.Tag("discord-status-webhook/db/drizzle")<
	Drizzle,
	DrizzleImpl
>() {}

const createDatabase = (config: DatabaseConfig) =>
	Effect.gen(function* () {
		yield* Effect.logInfo({
			event: "database_connection_start",
			service: "discord-status-webhook",
			database_url_preview: `${Redacted.value(config.url).slice(0, 20)}...`,
			max_connections: config.maxConnections ?? 20,
			timestamp: new Date().toISOString(),
		});

		try {
			const client = postgres(Redacted.value(config.url), {
				max: config.maxConnections ?? 20,
				idle_timeout: config.idleTimeout ?? 20,
				connect_timeout: config.connectTimeout ?? 10,
				// Add connection pooling and retry logic
				transform: postgres.camel,
				onnotice: (notice) => {
					// Log PostgreSQL notices as warnings (synchronously)
					console.warn("Database notice:", {
						event: "database_notice",
						service: "discord-status-webhook",
						notice: {
							severity: notice.severity,
							code: notice.code,
							message: notice.message,
						},
						timestamp: new Date().toISOString(),
					});
				},
			});

			const db = drizzle(client, {
				schema,
				logger: true, // Enable drizzle query logging in development
			});

			yield* Effect.logInfo({
				event: "database_connected",
				service: "discord-status-webhook",
				outcome: "success",
				timestamp: new Date().toISOString(),
			});

			return { db, client };
		} catch (error) {
			const errorInfo =
				error instanceof Error
					? {
							type: error.constructor.name,
							message: error.message,
							stack: error.stack,
						}
					: {
							type: "UnknownError",
							message: String(error),
						};

			yield* Effect.logError({
				event: "database_connection_failed",
				service: "discord-status-webhook",
				outcome: "error",
				error: {
					...errorInfo,
					retriable: true,
				},
				timestamp: new Date().toISOString(),
			});

			return yield* Effect.fail(
				new DrizzleError({
					cause: error,
					message: "Failed to connect to database",
					operation: "connect",
				}),
			);
		}
	});

const runMigrations = (db: ReturnType<typeof drizzle<typeof schema>>) =>
	Effect.gen(function* () {
		yield* Effect.logInfo({
			event: "database_migration_start",
			service: "discord-status-webhook",
			migrations_folder: "./drizzle",
			timestamp: new Date().toISOString(),
		});

		const startTime = Date.now();

		try {
			yield* Effect.tryPromise({
				try: () =>
					migrate(db, {
						migrationsFolder: "./drizzle",
						// Custom migration table for better tracking
						migrationsTable: "__drizzle_migrations",
					}),
				catch: (error) =>
					new DrizzleError({
						cause: error,
						message: "Failed to run database migrations",
						operation: "migrate",
					}),
			});

			yield* Effect.logInfo({
				event: "database_migration_completed",
				service: "discord-status-webhook",
				outcome: "success",
				duration_ms: Date.now() - startTime,
				timestamp: new Date().toISOString(),
			});
		} catch (error) {
			const errorInfo =
				error instanceof DrizzleError && error.cause instanceof Error
					? {
							type: error.cause.constructor.name,
							message: error.cause.message,
							details: (error.cause as { detail?: string })
								.detail,
						}
					: {
							type: "UnknownError",
							message: String(error),
						};

			yield* Effect.logError({
				event: "database_migration_failed",
				service: "discord-status-webhook",
				outcome: "error",
				duration_ms: Date.now() - startTime,
				error: {
					...errorInfo,
					retriable: false,
					critical: true, // Migration failures are critical
				},
				timestamp: new Date().toISOString(),
			});

			throw error;
		}
	});

export const make = (config?: Partial<DatabaseConfig>) =>
	Effect.gen(function* () {
		const databaseUrl = yield* Config.redacted("DATABASE_URL");

		const finalConfig: DatabaseConfig = {
			url: databaseUrl,
			maxConnections: config?.maxConnections ?? 20,
			idleTimeout: config?.idleTimeout ?? 20,
			connectTimeout: config?.connectTimeout ?? 10,
		};

		const { db } = yield* createDatabase(finalConfig);

		// Run migrations if enabled (default true for production)
		const shouldMigrate = yield* Config.withDefault(
			Config.boolean("DATABASE_MIGRATE"),
			true,
		);

		if (shouldMigrate) {
			yield* runMigrations(db);
		}

		const queryImpl = <T>(
			fn: (
				db: ReturnType<typeof drizzle<typeof schema>>,
			) => Promise<T> | T,
		) =>
			Effect.gen(function* () {
				const startTime = Date.now();

				try {
					const result = yield* Effect.tryPromise({
						try: () => Promise.resolve(fn(db)),
						catch: (error) =>
							new DrizzleError({
								cause: error,
								message: "Database query failed",
								operation: "query",
							}),
					});

					// Log debug for slow queries or in development
					const duration = Date.now() - startTime;
					if (duration > 1000) {
						yield* Effect.logDebug({
							event: "database_slow_query",
							service: "discord-status-webhook",
							outcome: "success",
							duration_ms: duration,
							timestamp: new Date().toISOString(),
						});
					}

					return result;
				} catch (error) {
					const errorInfo =
						error instanceof DrizzleError &&
						error.cause instanceof Error
							? {
									type: error.cause.constructor.name,
									message: error.cause.message,
									code: (
										error.cause as {
											code?: string;
											detail?: string;
										}
									).code,
									detail: (
										error.cause as {
											code?: string;
											detail?: string;
										}
									).detail,
								}
							: {
									type: "UnknownError",
									message: String(error),
								};

					yield* Effect.logError({
						event: "database_query_failed",
						service: "discord-status-webhook",
						outcome: "error",
						duration_ms: Date.now() - startTime,
						error: {
							...errorInfo,
							retriable: true,
						},
						timestamp: new Date().toISOString(),
					});

					throw error;
				}
			});

		const transactionImpl = <T>(fn: (tx: any) => Promise<T>) =>
			Effect.gen(function* () {
				const startTime = Date.now();

				try {
					const result = yield* Effect.tryPromise({
						try: () => db.transaction(fn),
						catch: (error) =>
							new DrizzleError({
								cause: error,
								message: "Database transaction failed",
								operation: "query",
							}),
					});

					yield* Effect.logDebug({
						event: "database_transaction_completed",
						service: "discord-status-webhook",
						outcome: "success",
						duration_ms: Date.now() - startTime,
						timestamp: new Date().toISOString(),
					});

					return result;
				} catch (error) {
					const errorInfo =
						error instanceof DrizzleError &&
						error.cause instanceof Error
							? {
									type: error.cause.constructor.name,
									message: error.cause.message,
								}
							: {
									type: "UnknownError",
									message: String(error),
								};

					yield* Effect.logError({
						event: "database_transaction_failed",
						service: "discord-status-webhook",
						outcome: "error",
						duration_ms: Date.now() - startTime,
						error: {
							...errorInfo,
							retriable: true,
						},
						timestamp: new Date().toISOString(),
					});

					throw error;
				}
			});

		return Drizzle.of({
			use: queryImpl,
			transaction: transactionImpl,
		});
	});

// Environment-based factory
export const fromEnv = Layer.scoped(Drizzle, make());
