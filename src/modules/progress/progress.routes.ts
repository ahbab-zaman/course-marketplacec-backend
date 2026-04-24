import { Router } from "express";
import { Role } from "@prisma/client";
import { prisma } from "../../database/prisma.js";
import ApiError from "../../shared/errors/api-error.js";
import authorize from "../../shared/middlewares/authorize.middleware.js";
import { success } from "../../shared/utils/response.js";

const router = Router();

router.patch(
  "/lessons/:lessonId/progress",
  authorize(Role.STUDENT, Role.INSTRUCTOR, Role.ADMIN),
  async (req, res, next) => {
    try {
      const userId = req.user?.id;
      if (!userId) throw new ApiError(401, "Authentication required");
      const { lessonId } = req.params;
      const { watchedSeconds = 0, isCompleted = false } = req.body as {
        watchedSeconds?: number;
        isCompleted?: boolean;
      };

      const progress = await prisma.lessonProgress.upsert({
        where: { userId_lessonId: { userId, lessonId } },
        update: {
          watchedSeconds,
          isCompleted,
          completedAt: isCompleted ? new Date() : null,
          lastWatchedAt: new Date(),
        },
        create: {
          userId,
          lessonId,
          watchedSeconds,
          isCompleted,
          completedAt: isCompleted ? new Date() : null,
        },
      });

      return success(res, progress, "Lesson progress updated");
    } catch (err) {
      next(err);
    }
  },
);

router.get(
  "/users/me/progress",
  authorize(Role.STUDENT, Role.INSTRUCTOR, Role.ADMIN),
  async (req, res, next) => {
    try {
      const userId = req.user?.id;
      if (!userId) throw new ApiError(401, "Authentication required");

      const progress = await prisma.lessonProgress.findMany({
        where: { userId },
        orderBy: { updatedAt: "desc" },
        select: {
          id: true,
          watchedSeconds: true,
          isCompleted: true,
          lesson: {
            select: {
              id: true,
              title: true,
              courseId: true,
              orderIndex: true,
              course: { select: { title: true, slug: true } },
            },
          },
        },
      });

      return success(res, progress, "Progress fetched successfully");
    } catch (err) {
      next(err);
    }
  },
);

export default router;
