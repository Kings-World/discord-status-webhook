import "@​skyra/env-utilities/setup";

import { envParseString } from "@skyra/env-utilities";
import { defineConfig } from "drizzle-kit";

export default defineConfig({
    out: "./drizzle",
    schema: "./src/db/schema.ts",
    dialect: "postgresql",
    dbCredentials: {
        url: envParseString("DATABASE_URL"),
    },
});

declare module "@skyra/env-utilities" {
    interface Env {
        DATABASE_URL: string;
    }
}
