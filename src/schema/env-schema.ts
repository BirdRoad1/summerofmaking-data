import z from "zod";

export const envSchema = z.object({
  PORT: z
    .string()
    .nonempty()
    .regex(/^\d{1,5}$/)
    .transform((str) => Number.parseInt(str))
    .refine((val) => val >= 0 && val <= 65535),
  SOC_COOKIE: z.string().nonempty(),
  SCRAPER_ENABLED: z
    .enum(["true", "false"])
    .optional()
    .default("false")
    .transform((value) => value === "true"),
});
