import { z } from "zod";
import { REGIONS } from "@/lib/regions";

export const createScrimSchema = z
  .object({
    teamId: z.string().uuid().optional(),
    region: z.enum(REGIONS),
    minRankId: z.coerce.number().int().min(0).max(11).optional(),
    maxRankId: z.coerce.number().int().min(0).max(11).optional(),
    // Converted to a UTC ISO string client-side (browser knows the
    // poster's own timezone) before the form ever submits — see
    // CreateScrimForm's hidden-input sync.
    scheduledFor: z
      .string()
      .refine((v) => !Number.isNaN(Date.parse(v)), "Pick a valid date and time")
      .refine((v) => new Date(v).getTime() > Date.now(), "Must be in the future"),
    notes: z.string().trim().max(500, "500 characters max").optional(),
  })
  .refine(
    (data) =>
      data.minRankId === undefined ||
      data.maxRankId === undefined ||
      data.minRankId <= data.maxRankId,
    { message: "Min rank must be at or below max rank", path: ["maxRankId"] },
  );

export type CreateScrimInput = z.infer<typeof createScrimSchema>;

export const respondToScrimSchema = z.object({
  teamId: z.string().uuid().optional(),
  message: z.string().trim().max(300, "300 characters max").optional(),
});

export type RespondToScrimInput = z.infer<typeof respondToScrimSchema>;
