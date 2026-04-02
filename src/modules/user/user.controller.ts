import { NextFunction, Request, Response } from "express";
import ApiError from "../../shared/errors/api-error";
import { success } from "../../shared/utils/response";
import { userService } from "./user.service";
import { updateUserProfileSchema } from "./user.validator";

export class UserController {
  async getMe(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new ApiError(401, "Authentication required");
      }

      const profile = await userService.getProfile(userId);
      return success(res, profile, "Profile fetched successfully");
    } catch (err) {
      next(err);
    }
  }

  async updateMe(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new ApiError(401, "Authentication required");
      }

      const payload = updateUserProfileSchema.parse(req.body);
      const profile = await userService.updateProfile(userId, payload);
      return success(res, profile, "Profile updated successfully");
    } catch (err) {
      next(err);
    }
  }

  async getMyLearning(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new ApiError(401, "Authentication required");
      }

      const learning = await userService.getLearningSummary(userId);
      return success(res, learning, "Learning summary fetched successfully");
    } catch (err) {
      next(err);
    }
  }
}

export const userController = new UserController();
