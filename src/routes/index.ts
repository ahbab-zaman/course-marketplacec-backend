import { Router } from "express";
import { healthRoutes } from "../modules/health/health.route";
import userRoutes from "../modules/user/user.routes";
import courseCategoryRoutes from "../modules/course-category/course-category.routes";
import courseRoutes from "../modules/course/course.routes";

const router = Router();

// versioned API
const v1 = Router();

v1.use("/health", healthRoutes);
v1.use("/users", userRoutes);
v1.use("/categories", courseCategoryRoutes);
v1.use("/courses", courseRoutes);

router.use("/v1", v1);

export const apiRoutes = router;
