import { Router } from "express";
import { Role } from "@prisma/client";
import { prisma } from "../../database/prisma.js";
import authorize from "../../shared/middlewares/authorize.middleware.js";
import { success } from "../../shared/utils/response.js";

const router = Router();

router.use(authorize(Role.ADMIN));

router.get("/users", async (_req, res, next) => {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isBlocked: true,
        createdAt: true,
      },
    });
    return success(res, users, "Admin users fetched");
  } catch (err) {
    next(err);
  }
});

router.get("/courses", async (_req, res, next) => {
  try {
    const courses = await prisma.course.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: "desc" },
      take: 100,
      select: {
        id: true,
        title: true,
        status: true,
        enrollmentCount: true,
        avgRating: true,
        instructor: { select: { id: true, name: true } },
      },
    });
    return success(res, courses, "Admin courses fetched");
  } catch (err) {
    next(err);
  }
});

router.get("/payments", async (_req, res, next) => {
  try {
    const payments = await prisma.payment.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
      select: {
        id: true,
        amount: true,
        currency: true,
        status: true,
        createdAt: true,
        user: { select: { id: true, name: true, email: true } },
        course: { select: { id: true, title: true } },
      },
    });
    return success(res, payments, "Admin payments fetched");
  } catch (err) {
    next(err);
  }
});

router.get("/reviews", async (_req, res, next) => {
  try {
    const reviews = await prisma.review.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
      select: {
        id: true,
        rating: true,
        comment: true,
        createdAt: true,
        user: { select: { id: true, name: true } },
        course: { select: { id: true, title: true } },
      },
    });
    return success(res, reviews, "Admin reviews fetched");
  } catch (err) {
    next(err);
  }
});

router.get("/analytics", async (_req, res, next) => {
  try {
    const [users, courses, enrollments, payments] = await Promise.all([
      prisma.user.count(),
      prisma.course.count({ where: { deletedAt: null } }),
      prisma.enrollment.count(),
      prisma.payment.aggregate({ _sum: { amount: true } }),
    ]);

    return success(
      res,
      {
        totalUsers: users,
        totalCourses: courses,
        totalEnrollments: enrollments,
        grossRevenue: payments._sum.amount ?? 0,
      },
      "Admin analytics fetched",
    );
  } catch (err) {
    next(err);
  }
});

export default router;
