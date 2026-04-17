import { NextFunction, Request, Response } from "express";
import ApiError from "../../shared/errors/api-error.js";
import { success } from "../../shared/utils/response.js";
import { courseService } from "./course.service.js";
import {
  courseIdParamSchema,
  courseIdentifierSchema,
  courseListQuerySchema,
  createCourseSchema,
  myCourseListQuerySchema,
  updateCourseSchema,
} from "./course.validator.js";

export class CourseController {
  async createCourse(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      const role = req.user?.role;

      if (!userId || !role) {
        throw new ApiError(401, "Authentication required");
      }

      const payload = createCourseSchema.parse(req.body);
      const course = await courseService.createCourse(
        { id: userId, role },
        payload,
      );

      return success(res, course, "Course created successfully");
    } catch (err) {
      next(err);
    }
  }

  async getPublicCourses(req: Request, res: Response, next: NextFunction) {
    try {
      const query = courseListQuerySchema.parse(req.query);
      const result = await courseService.getPublicCourses(query);

      return success(
        res,
        result.courses,
        "Courses fetched successfully",
        result.meta,
      );
    } catch (err) {
      next(err);
    }
  }

  async getPublicCourseDetail(req: Request, res: Response, next: NextFunction) {
    try {
      const params = courseIdentifierSchema.parse(req.params);
      const course = await courseService.getPublicCourseDetail(params.slugOrId);

      return success(res, course, "Course fetched successfully");
    } catch (err) {
      next(err);
    }
  }

  async getMyCourses(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      const role = req.user?.role;

      if (!userId || !role) {
        throw new ApiError(401, "Authentication required");
      }

      const query = myCourseListQuerySchema.parse(req.query);
      const result = await courseService.getMyCourses({ id: userId, role }, query);

      return success(
        res,
        result.courses,
        "Instructor courses fetched successfully",
        result.meta,
      );
    } catch (err) {
      next(err);
    }
  }

  async updateCourse(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      const role = req.user?.role;

      if (!userId || !role) {
        throw new ApiError(401, "Authentication required");
      }

      const params = courseIdParamSchema.parse(req.params);
      const payload = updateCourseSchema.parse(req.body);
      const course = await courseService.updateCourse(
        { id: userId, role },
        params.id,
        payload,
      );

      return success(res, course, "Course updated successfully");
    } catch (err) {
      next(err);
    }
  }

  async deleteCourse(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      const role = req.user?.role;

      if (!userId || !role) {
        throw new ApiError(401, "Authentication required");
      }

      const params = courseIdParamSchema.parse(req.params);
      const course = await courseService.deleteCourse(
        { id: userId, role },
        params.id,
      );

      return success(res, course, "Course deleted successfully");
    } catch (err) {
      next(err);
    }
  }

  async submitCourseForReview(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const userId = req.user?.id;
      const role = req.user?.role;

      if (!userId || !role) {
        throw new ApiError(401, "Authentication required");
      }

      const params = courseIdParamSchema.parse(req.params);
      const course = await courseService.submitCourseForReview(
        { id: userId, role },
        params.id,
      );

      return success(res, course, "Course submitted for review successfully");
    } catch (err) {
      next(err);
    }
  }
}

export const courseController = new CourseController();
