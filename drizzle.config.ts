import "dotenv/config";
import "@skyra/env-utilities";

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
