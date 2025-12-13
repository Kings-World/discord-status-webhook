import { drizzle } from "drizzle-orm/postgres-js";
import { Config, Context, Data, Effect, Layer, Redacted } from "effect";
import * as schema from "./schema.js";

export class DrizzleError extends Data.TaggedError("DrizzleError")<{
	cause?: unknown;
	message?: string;
}> {}

type DrizzleImpl = {
	use: <T>(
		fn: (db: ReturnType<typeof drizzle<typeof schema>>) => T,
	) => Effect.Effect<Awaited<T>, DrizzleError, never>;
};

export class Drizzle extends Context.Tag("discord-status-webhook/db/drizzle")<
	Drizzle,
	DrizzleImpl
>() {}

export const make = (...params: Parameters<typeof drizzle<typeof schema>>) =>
	Effect.gen(function* () {
		const db = yield* Effect.try({
			try: () => drizzle(...params),
			catch: (error) =>
				new DrizzleError({
					cause: error,
					message: "Failed to connect to the database",
				}),
		});

		return Drizzle.of({
			use: (fn) =>
				Effect.gen(function* () {
					const result = yield* Effect.try({
						try: () => {
							const out = fn(db);

							if (
								typeof out === "object" &&
								out &&
								"then" in out &&
								typeof out.then === "function"
							) {
								// drizzle queries return a PgRelationalQuery class rather than a promise directly
								// therefore, we need to manually call it, so Effect.tryPromise() will execute
								//
								// note: the condition is messy because PgRelationalQuery does not get exported,
								// so can't just call `if (out instanceof PgRelationalQuery) { ... }`
								return out.then((res: unknown) => res);
							}

							return out;
						},
						catch: (error) =>
							new DrizzleError({
								cause: error,
								message: "Synchronous error in `Drizzle.use`",
							}),
					});

					if (result instanceof Promise) {
						return yield* Effect.tryPromise({
							try: () => result,
							catch: (error) =>
								new DrizzleError({
									cause: error,
									message:
										"Asynchronous error in `Discord.use`",
								}),
						});
					}

					return result;
				}),
		});
	});

export const fromEnv = Layer.scoped(
	Drizzle,
	Effect.gen(function* () {
		yield* Effect.logInfo("Connecting to the database");
		const databaseUrl = yield* Config.redacted("DATABASE_URL");
		return yield* make(Redacted.value(databaseUrl), { schema });
	}),
);
