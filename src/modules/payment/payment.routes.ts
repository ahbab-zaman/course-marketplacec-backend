import { Router } from "express";
import authorize from "../../shared/middlewares/authorize.middleware.js";
import { prisma } from "../../database/prisma.js";
import { Role } from "@prisma/client";
import ApiError from "../../shared/errors/api-error.js";
import { success } from "../../shared/utils/response.js";

const router = Router();

router.post(
  "/checkout",
  authorize(Role.STUDENT, Role.INSTRUCTOR, Role.ADMIN),
  async (req, res, next) => {
    try {
      const userId = req.user?.id;
      if (!userId) throw new ApiError(401, "Authentication required");
      const { courseId } = req.body as { courseId?: string };
      if (!courseId) throw new ApiError(400, "courseId is required");

      const course = await prisma.course.findFirst({
        where: { id: courseId, deletedAt: null },
        select: { id: true, price: true },
      });
      if (!course) throw new ApiError(404, "Course not found");

      const sessionId = `sim_${Date.now()}_${userId.slice(0, 6)}`;
      const payment = await prisma.payment.create({
        data: {
          userId,
          courseId,
          amount: course.price,
          status: "PENDING",
          stripeCheckoutSessionId: sessionId,
        },
      });

      return success(
        res,
        {
          paymentId: payment.id,
          checkoutSessionId: sessionId,
          checkoutUrl: `/checkout/simulated?session_id=${sessionId}`,
        },
        "Checkout session created",
      );
    } catch (err) {
      next(err);
    }
  },
);

router.post(
  "/verify",
  authorize(Role.STUDENT, Role.INSTRUCTOR, Role.ADMIN),
  async (req, res, next) => {
    try {
      const userId = req.user?.id;
      if (!userId) throw new ApiError(401, "Authentication required");
      const { checkoutSessionId } = req.body as { checkoutSessionId?: string };
      if (!checkoutSessionId) {
        throw new ApiError(400, "checkoutSessionId is required");
      }

      const payment = await prisma.payment.findFirst({
        where: { stripeCheckoutSessionId: checkoutSessionId, userId },
      });
      if (!payment) throw new ApiError(404, "Payment session not found");

      const updated = await prisma.payment.update({
        where: { id: payment.id },
        data: { status: "SUCCEEDED", paidAt: new Date() },
      });

      await prisma.enrollment.upsert({
        where: { userId_courseId: { userId, courseId: updated.courseId } },
        update: {
          status: "ACTIVE",
          paymentId: updated.id,
          accessGrantedAt: new Date(),
          lastAccessedAt: new Date(),
        },
        create: {
          userId,
          courseId: updated.courseId,
          paymentId: updated.id,
          status: "ACTIVE",
          accessGrantedAt: new Date(),
        },
      });

      return success(
        res,
        { paymentId: updated.id, status: updated.status },
        "Payment verified and enrollment granted",
      );
    } catch (err) {
      next(err);
    }
  },
);

router.post("/webhook", async (req, res) => {
  return success(res, { received: true, event: req.body ?? null }, "Webhook received");
});

export default router;
