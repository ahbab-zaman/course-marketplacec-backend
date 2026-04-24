import { Router } from "express";
import { Role } from "@prisma/client";
import { prisma } from "../../database/prisma.js";
import ApiError from "../../shared/errors/api-error.js";
import authorize from "../../shared/middlewares/authorize.middleware.js";
import { success } from "../../shared/utils/response.js";

const router = Router();

router.get("/courses/:courseId/reviews", async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const reviews = await prisma.review.findMany({
      where: { courseId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        rating: true,
        comment: true,
        createdAt: true,
        user: { select: { id: true, name: true, avatar: true } },
      },
    });
    return success(res, reviews, "Reviews fetched successfully");
  } catch (err) {
    next(err);
  }
});

router.post(
  "/courses/:courseId/reviews",
  authorize(Role.STUDENT, Role.INSTRUCTOR, Role.ADMIN),
  async (req, res, next) => {
    try {
      const userId = req.user?.id;
      if (!userId) throw new ApiError(401, "Authentication required");
      const { courseId } = req.params;
      const { rating, comment } = req.body as { rating?: number; comment?: string };
      if (!rating || rating < 1 || rating > 5) {
        throw new ApiError(400, "rating must be between 1 and 5");
      }

      const review = await prisma.review.upsert({
        where: { userId_courseId: { userId, courseId } },
        update: { rating, comment: comment ?? null },
        create: { userId, courseId, rating, comment: comment ?? null },
      });

      const aggregate = await prisma.review.aggregate({
        where: { courseId },
        _avg: { rating: true },
        _count: { rating: true },
      });
      await prisma.course.update({
        where: { id: courseId },
        data: {
          avgRating: aggregate._avg.rating ?? 0,
          totalReviews: aggregate._count.rating ?? 0,
        },
      });

      return success(res, review, "Review saved successfully");
    } catch (err) {
      next(err);
    }
  },
);

router.delete(
  "/reviews/:id",
  authorize(Role.ADMIN),
  async (req, res, next) => {
    try {
      const review = await prisma.review.delete({ where: { id: req.params.id } });
      return success(res, review, "Review removed");
    } catch (err) {
      next(err);
    }
  },
);

export default router;
