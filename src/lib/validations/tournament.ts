import { z } from "zod";
import { REGIONS } from "@/lib/regions";

export const MAX_BANNER_BYTES = 4 * 1024 * 1024; // 4MB
const ALLOWED_BANNER_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif"];

const bannerSchema = z
  .instanceof(File)
  .refine((f) => f.size <= MAX_BANNER_BYTES, "4MB max")
  .refine((f) => ALLOWED_BANNER_TYPES.includes(f.type), "PNG, JPEG, WebP, or GIF only")
  .optional();

export const createTournamentSchema = z
  .object({
    title: z.string().trim().min(3, "At least 3 characters").max(80, "80 characters max"),
    description: z.string().trim().max(2000, "2000 characters max").optional(),
    format: z.string().trim().max(60, "60 characters max").optional(),
    region: z.enum(REGIONS),
    prizePool: z.string().trim().max(60, "60 characters max").optional(),
    entryType: z.enum(["solo", "team"]),
    maxParticipants: z.coerce.number().int().min(2, "At least 2").max(256, "256 max"),
    minRankId: z.coerce.number().int().min(0).max(11).optional(),
    maxRankId: z.coerce.number().int().min(0).max(11).optional(),
    // Both converted to UTC ISO strings client-side before submit.
    startsAt: z
      .string()
      .refine((v) => !Number.isNaN(Date.parse(v)), "Pick a valid date and time"),
    registrationClosesAt: z
      .string()
      .refine((v) => !Number.isNaN(Date.parse(v)), "Pick a valid date and time"),
    // Signups happen off-site (Discord, a form, etc.) — this is where
    // "Sign Up" sends people. Optional so a draft can be saved before
    // that link exists yet.
    signupUrl: z.string().trim().max(300, "300 characters max").url("Enter a valid URL").optional(),
    banner: bannerSchema,
  })
  .refine(
    (data) =>
      data.minRankId === undefined ||
      data.maxRankId === undefined ||
      data.minRankId <= data.maxRankId,
    { message: "Min rank must be at or below max rank", path: ["maxRankId"] },
  )
  .refine(
    (data) => new Date(data.registrationClosesAt).getTime() <= new Date(data.startsAt).getTime(),
    { message: "Registration should close at or before the start", path: ["registrationClosesAt"] },
  );

export type CreateTournamentInput = z.infer<typeof createTournamentSchema>;
