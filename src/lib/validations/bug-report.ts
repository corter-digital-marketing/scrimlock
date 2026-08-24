import { z } from "zod";

export const bugReportSchema = z.object({
  email: z.string().trim().max(200).email("Enter a valid email address").optional().or(z.literal("")),
  message: z
    .string()
    .trim()
    .min(10, "A few more details would help")
    .max(2000, "2000 characters max"),
});

export type BugReportInput = z.infer<typeof bugReportSchema>;
