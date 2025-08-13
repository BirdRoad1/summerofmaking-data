import z from "zod";

export const usersSchema = z.object({
  sort: z.enum(["mins", "devlogs", "url", "random"]).optional().default("mins"),
  limit: z
    .string()
    .optional()
    .default("20")
    .transform((s) => Number.parseInt(s))
    .refine((n) => Number.isFinite(n) && n >= 1 && n <= 200, {
      message: "must be between 1 and 200",
    }),
  author: z.string().nonempty().optional(),
  nameOrSlackId: z.string().nonempty().optional(),
});
