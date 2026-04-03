import { CourseStatus } from "@prisma/client";
import { z } from "zod";

const courseSortValues = [
  "newest",
  "oldest",
  "price_asc",
  "price_desc",
  "rating_desc",
  "popular_desc",
] as const;

const myCourseSortValues = [
  "newest",
  "oldest",
  "updated_desc",
  "price_asc",
  "price_desc",
] as const;

export const courseIdentifierSchema = z.object({
  slugOrId: z.string().min(1),
});

export const courseIdParamSchema = z.object({
  id: z.string().uuid(),
});

export const createCourseSchema = z.object({
  title: z.string().trim().min(3).max(160),
  shortDescription: z.string().trim().max(240).nullable().optional(),
  description: z.string().trim().min(20).max(10000),
  thumbnail: z.string().url().nullable().optional(),
  price: z.coerce.number().min(0),
  categoryId: z.string().uuid().nullable().optional(),
});

export const updateCourseSchema = z
  .object({
    title: z.string().trim().min(3).max(160).optional(),
    shortDescription: z.string().trim().max(240).nullable().optional(),
    description: z.string().trim().min(20).max(10000).optional(),
    thumbnail: z.string().url().nullable().optional(),
    price: z.coerce.number().min(0).optional(),
    categoryId: z.string().uuid().nullable().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  });

export const courseListQuerySchema = z
  .object({
    page: z.coerce.number().min(1).optional(),
    limit: z.coerce.number().min(1).max(100).optional(),
    search: z.string().trim().min(1).max(120).optional(),
    categoryId: z.string().uuid().optional(),
    categorySlug: z.string().trim().min(2).max(120).optional(),
    instructorId: z.string().uuid().optional(),
    minPrice: z.coerce.number().min(0).optional(),
    maxPrice: z.coerce.number().min(0).optional(),
    sort: z.enum(courseSortValues).optional(),
  })
  .refine(
    (data) =>
      data.minPrice === undefined ||
      data.maxPrice === undefined ||
      data.minPrice <= data.maxPrice,
    {
      message: "minPrice cannot be greater than maxPrice",
      path: ["minPrice"],
    },
  );

export const myCourseListQuerySchema = z.object({
  page: z.coerce.number().min(1).optional(),
  limit: z.coerce.number().min(1).max(100).optional(),
  search: z.string().trim().min(1).max(120).optional(),
  status: z.nativeEnum(CourseStatus).optional(),
  sort: z.enum(myCourseSortValues).optional(),
});
