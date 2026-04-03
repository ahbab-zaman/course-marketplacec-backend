import { VideoProvider } from "@prisma/client";
import { z } from "zod";

export const courseLessonParamsSchema = z.object({
  courseId: z.string().uuid(),
});

export const lessonIdParamSchema = z.object({
  lessonId: z.string().uuid(),
});

export const lessonIdUpdateParamSchema = z.object({
  id: z.string().uuid(),
});

export const createLessonSchema = z.object({
  title: z.string().trim().min(3).max(160),
  summary: z.string().trim().max(1000).nullable().optional(),
  orderIndex: z.coerce.number().int().min(1),
  videoProvider: z.nativeEnum(VideoProvider),
  providerAssetId: z.string().trim().min(2).max(255),
  providerPlaybackRef: z.string().trim().min(2).max(255).nullable().optional(),
  durationSeconds: z.coerce.number().int().min(0).optional(),
  isPreview: z.boolean().optional(),
});

export const updateLessonSchema = z
  .object({
    title: z.string().trim().min(3).max(160).optional(),
    summary: z.string().trim().max(1000).nullable().optional(),
    orderIndex: z.coerce.number().int().min(1).optional(),
    videoProvider: z.nativeEnum(VideoProvider).optional(),
    providerAssetId: z.string().trim().min(2).max(255).optional(),
    providerPlaybackRef: z.string().trim().min(2).max(255).nullable().optional(),
    durationSeconds: z.coerce.number().int().min(0).optional(),
    isPreview: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  });
