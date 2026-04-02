import { NextFunction, Request, Response } from "express";
import { success } from "../../shared/utils/response";
import { courseCategoryService } from "./course-category.service";
import {
  courseCategoryQuerySchema,
  createCourseCategorySchema,
  updateCourseCategorySchema,
} from "./course-category.validator";

export class CourseCategoryController {
  async getPublicCategories(req: Request, res: Response, next: NextFunction) {
    try {
      const query = courseCategoryQuerySchema.parse(req.query);
      const result = await courseCategoryService.getPublicCategories(query);
      return success(
        res,
        result.categories,
        "Course categories fetched successfully",
        result.meta,
      );
    } catch (err) {
      next(err);
    }
  }

  async getCategoryBySlug(req: Request, res: Response, next: NextFunction) {
    try {
      const category = await courseCategoryService.getCategoryBySlug(
        String(req.params.slug),
      );
      return success(res, category, "Course category fetched successfully");
    } catch (err) {
      next(err);
    }
  }

  async getAdminCategories(req: Request, res: Response, next: NextFunction) {
    try {
      const query = courseCategoryQuerySchema.parse(req.query);
      const result = await courseCategoryService.getAdminCategories(query);
      return success(
        res,
        result.categories,
        "Course categories fetched successfully",
        result.meta,
      );
    } catch (err) {
      next(err);
    }
  }

  async createCategory(req: Request, res: Response, next: NextFunction) {
    try {
      const payload = createCourseCategorySchema.parse(req.body);
      const category = await courseCategoryService.createCategory(payload);
      return success(res, category, "Course category created successfully");
    } catch (err) {
      next(err);
    }
  }

  async updateCategory(req: Request, res: Response, next: NextFunction) {
    try {
      const payload = updateCourseCategorySchema.parse(req.body);
      const category = await courseCategoryService.updateCategory(
        String(req.params.id),
        payload,
      );
      return success(res, category, "Course category updated successfully");
    } catch (err) {
      next(err);
    }
  }
}

export const courseCategoryController = new CourseCategoryController();
