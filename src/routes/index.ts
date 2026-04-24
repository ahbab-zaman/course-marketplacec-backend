import { Router } from "express";
import { healthRoutes } from "../modules/health/health.route.js";
import userRoutes from "../modules/user/user.routes.js";
import courseCategoryRoutes from "../modules/course-category/course-category.routes.js";
import courseRoutes from "../modules/course/course.routes.js";
import authRoutes from "../modules/auth/auth.routes.js";
import lessonRoutes from "../modules/lesson/lesson.routes.js";
import paymentRoutes from "../modules/payment/payment.routes.js";
import progressRoutes from "../modules/progress/progress.routes.js";
import reviewRoutes from "../modules/review/review.routes.js";
import adminRoutes from "../modules/admin/admin.routes.js";

const router = Router();

// versioned API
const v1 = Router();

v1.use("/health", healthRoutes);
v1.use("/auth", authRoutes);
v1.use("/users", userRoutes);
v1.use("/categories", courseCategoryRoutes);
v1.use("/courses", courseRoutes);
v1.use("/", lessonRoutes);
v1.use("/payments", paymentRoutes);
v1.use("/", progressRoutes);
v1.use("/", reviewRoutes);
v1.use("/admin", adminRoutes);

router.use("/v1", v1);

export const apiRoutes = router;
