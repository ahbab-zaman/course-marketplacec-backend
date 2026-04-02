import ApiError from "../../shared/errors/api-error";
import { getPagination } from "../../shared/utils/pagination";
import { courseCategoryRepository } from "./course-category.repository";
import {
  CourseCategoryQuery,
  CreateCourseCategoryDTO,
  UpdateCourseCategoryDTO,
} from "./course-category.types";

export class CourseCategoryService {
  async getPublicCategories(query: CourseCategoryQuery) {
    const { page, limit, skip, take } = getPagination(query);
    const [categories, total] = await Promise.all([
      courseCategoryRepository.findMany(skip, take, false),
      courseCategoryRepository.count(false),
    ]);

    return {
      categories,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getAdminCategories(query: CourseCategoryQuery) {
    const { page, limit, skip, take } = getPagination(query);
    const [categories, total] = await Promise.all([
      courseCategoryRepository.findMany(skip, take, true),
      courseCategoryRepository.count(true),
    ]);

    return {
      categories,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getCategoryBySlug(slug: string) {
    const category = await courseCategoryRepository.findBySlug(slug);
    if (!category || !category.isActive) {
      throw new ApiError(404, "Course category not found");
    }
    return category;
  }

  async createCategory(payload: CreateCourseCategoryDTO) {
    const existing = await courseCategoryRepository.findBySlug(payload.slug);
    if (existing) {
      throw new ApiError(409, "Course category slug already exists");
    }

    return courseCategoryRepository.create(payload);
  }

  async updateCategory(id: string, payload: UpdateCourseCategoryDTO) {
    const category = await courseCategoryRepository.findById(id);
    if (!category) {
      throw new ApiError(404, "Course category not found");
    }

    if (payload.slug && payload.slug !== category.slug) {
      const existing = await courseCategoryRepository.findBySlug(payload.slug);
      if (existing) {
        throw new ApiError(409, "Course category slug already exists");
      }
    }

    return courseCategoryRepository.update(id, payload);
  }
}

export const courseCategoryService = new CourseCategoryService();
