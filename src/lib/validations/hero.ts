import { z } from "zod";

export const addHeroSchema = z.object({
  name: z.string().trim().min(2, "At least 2 characters").max(40, "40 characters max"),
});

export type AddHeroInput = z.infer<typeof addHeroSchema>;
