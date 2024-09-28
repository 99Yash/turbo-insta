import { type Config } from "drizzle-kit";

import { env } from "~/env";

export default {
  schema: "./src/server/db/schema/index.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: env.DATABASE_URL,
  },
  tablesFilter: ["turbo-insta_*"],
  verbose: true, // Print all statements
  // Always ask for confirmation
  strict: true,
} satisfies Config;
