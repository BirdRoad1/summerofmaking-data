import z from "zod";

const boolStrSchema = z
  .enum(["true", "false"])
  .optional()
  .default("false")
  .transform((value) => value === "true");

export const envSchema = z.object({
  PORT: z
    .string()
    .nonempty()
    .regex(/^\d{1,5}$/)
    .transform((str) => Number.parseInt(str))
    .refine((val) => val >= 0 && val <= 65535),
  SOC_COOKIE: z.string().nonempty(),
  SCRAPER_ENABLED: boolStrSchema,
  REVERSE_PROXY: boolStrSchema,
  SECRET_KEY: z
    .string()
    .regex(/^[a-fA-F0-9]{32}$/, {
      message: "Secret key must be a 32-character hexadecimal string",
    })
    .length(32),
});
