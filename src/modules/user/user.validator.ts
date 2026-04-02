import { z } from "zod";

export const updateUserProfileSchema = z
  .object({
    name: z.string().min(2).max(100).optional(),
    phone: z.string().min(6).max(20).nullable().optional(),
    avatar: z.string().url().nullable().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  });
