import { envSchema } from "./schema/env-schema";

try {
  await import("dotenv/config");
  console.log("Loaded .env");
} catch {}

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  console.log("Invalid environment variables. Error:", parsed.error);
  process.exit(1);
}

export const env = parsed.data;
