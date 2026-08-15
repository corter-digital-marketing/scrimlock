import { z } from "zod";
import { REGIONS } from "@/lib/regions";

export const MAX_LOGO_BYTES = 2 * 1024 * 1024; // 2MB
const ALLOWED_LOGO_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif"];

const logoSchema = z
  .instanceof(File)
  .refine((f) => f.size <= MAX_LOGO_BYTES, "2MB max")
  .refine((f) => ALLOWED_LOGO_TYPES.includes(f.type), "PNG, JPEG, WebP, or GIF only")
  .optional();

export const createTeamSchema = z.object({
  name: z.string().trim().min(2, "At least 2 characters").max(40, "40 characters max"),
  tag: z
    .string()
    .trim()
    .min(2, "At least 2 characters")
    .max(5, "5 characters max")
    .regex(/^[a-zA-Z0-9]+$/, "Letters and numbers only"),
  region: z.enum(REGIONS).optional(),
  description: z.string().trim().max(500, "500 characters max").optional(),
  logo: logoSchema,
});

export type CreateTeamInput = z.infer<typeof createTeamSchema>;

export const updateTeamSchema = createTeamSchema.extend({
  isRecruiting: z.boolean(),
  recruitingNote: z.string().trim().max(140, "140 characters max").optional(),
});

export type UpdateTeamInput = z.infer<typeof updateTeamSchema>;
