import { NextFunction, Request, Response } from "express";
import ApiError from "../../shared/errors/api-error.js";
import { success } from "../../shared/utils/response.js";
import { lessonService } from "./lesson.service.js";
import {
  courseLessonParamsSchema,
  createLessonSchema,
  lessonIdParamSchema,
  lessonIdUpdateParamSchema,
  updateLessonSchema,
} from "./lesson.validator.js";

export class LessonController {
  async createLesson(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      const role = req.user?.role;

      if (!userId || !role) {
        throw new ApiError(401, "Authentication required");
      }

      const params = courseLessonParamsSchema.parse(req.params);
      const payload = createLessonSchema.parse(req.body);
      const lesson = await lessonService.createLesson(
        { id: userId, role },
        params.courseId,
        payload,
      );

      return success(res, lesson, "Lesson created successfully");
    } catch (err) {
      next(err);
    }
  }

  async getCourseLessons(req: Request, res: Response, next: NextFunction) {
    try {
      const params = courseLessonParamsSchema.parse(req.params);
      const result = await lessonService.getCourseLessons(
        params.courseId,
        req.user
          ? {
              id: req.user.id,
              role: req.user.role,
            }
          : undefined,
      );

      return success(
        res,
        result.lessons,
        result.visibility === "managed"
          ? "Course lessons fetched successfully"
          : "Preview lessons fetched successfully",
      );
    } catch (err) {
      next(err);
    }
  }

  async updateLesson(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      const role = req.user?.role;

      if (!userId || !role) {
        throw new ApiError(401, "Authentication required");
      }

      const params = lessonIdUpdateParamSchema.parse(req.params);
      const payload = updateLessonSchema.parse(req.body);
      const lesson = await lessonService.updateLesson(
        { id: userId, role },
        params.id,
        payload,
      );

      return success(res, lesson, "Lesson updated successfully");
    } catch (err) {
      next(err);
    }
  }

  async deleteLesson(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      const role = req.user?.role;

      if (!userId || !role) {
        throw new ApiError(401, "Authentication required");
      }

      const params = lessonIdUpdateParamSchema.parse(req.params);
      const lesson = await lessonService.deleteLesson(
        { id: userId, role },
        params.id,
      );

      return success(res, lesson, "Lesson deleted successfully");
    } catch (err) {
      next(err);
    }
  }

  async getPlayback(req: Request, res: Response, next: NextFunction) {
    try {
      const params = lessonIdParamSchema.parse(req.params);
      const result = await lessonService.getPlayback(
        req.user
          ? {
              id: req.user.id,
              role: req.user.role,
            }
          : undefined,
        params.lessonId,
      );

      return success(res, result, "Lesson playback fetched successfully");
    } catch (err) {
      next(err);
    }
  }
}

export const lessonController = new LessonController();
