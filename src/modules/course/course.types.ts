import { CourseStatus } from "@prisma/client";

export type CourseListQuery = {
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: string;
  categorySlug?: string;
  instructorId?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?:
    | "newest"
    | "oldest"
    | "price_asc"
    | "price_desc"
    | "rating_desc"
    | "popular_desc";
};

export type MyCourseListQuery = {
  page?: number;
  limit?: number;
  search?: string;
  status?: CourseStatus;
  sort?: "newest" | "oldest" | "updated_desc" | "price_asc" | "price_desc";
};

export type CreateCourseDTO = {
  title: string;
  shortDescription?: string | null;
  description: string;
  thumbnail?: string | null;
  price: number;
  categoryId?: string | null;
};

export type UpdateCourseDTO = {
  title?: string;
  shortDescription?: string | null;
  description?: string;
  thumbnail?: string | null;
  price?: number;
  categoryId?: string | null;
};
