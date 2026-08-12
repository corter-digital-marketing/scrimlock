import { z } from "zod";
import { REGIONS } from "@/lib/regions";

export const MAX_PREFERRED_HEROES = 8;
export const MAX_AVATAR_BYTES = 2 * 1024 * 1024; // 2MB
const ALLOWED_AVATAR_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif"];

export const profileSchema = z
  .object({
    username: z
      .string()
      .trim()
      .min(3, "At least 3 characters")
      .max(20, "20 characters max")
      .regex(/^[a-zA-Z0-9_]+$/, "Letters, numbers, and underscores only"),
    displayName: z
      .string()
      .trim()
      .min(1, "Required")
      .max(40, "40 characters max"),
    bio: z.string().trim().max(500, "500 characters max").optional(),
    discordHandle: z.string().trim().max(40, "40 characters max").optional(),
    region: z.enum(REGIONS).optional(),
    timezone: z.string().trim().max(64, "64 characters max").optional(),
    rankId: z.coerce.number().int().min(0).max(11).optional(),
    rankSubrank: z.coerce.number().int().min(1).max(6).optional(),
    preferredHeroes: z
      .array(z.string().uuid())
      .max(MAX_PREFERRED_HEROES, `Pick up to ${MAX_PREFERRED_HEROES} heroes`),
    playstyleNote: z.string().trim().max(200, "200 characters max").optional(),
    isLft: z.boolean(),
    avatar: z
      .instanceof(File)
      .refine((f) => f.size <= MAX_AVATAR_BYTES, "2MB max")
      .refine(
        (f) => ALLOWED_AVATAR_TYPES.includes(f.type),
        "PNG, JPEG, WebP, or GIF only",
      )
      .optional(),
  })
  .refine(
    (data) =>
      data.rankId === undefined ||
      data.rankId === 0 ||
      data.rankSubrank !== undefined,
    { message: "Pick a subrank", path: ["rankSubrank"] },
  );

export type ProfileInput = z.infer<typeof profileSchema>;
