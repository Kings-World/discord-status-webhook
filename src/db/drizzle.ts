import { envParseString } from "@skyra/env-utilities";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "./schema.js";

export const db = drizzle(envParseString("DATABASE_URL"), { schema });
