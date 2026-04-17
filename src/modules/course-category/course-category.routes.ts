import { Router } from "express";
import { Role } from "@prisma/client";
import authorize from "../../shared/middlewares/authorize.middleware.js";
import { courseCategoryController } from "./course-category.controller.js";

const router = Router();

router.get(
  "/",
  courseCategoryController.getPublicCategories.bind(courseCategoryController),
);
router.get(
  "/:slug",
  courseCategoryController.getCategoryBySlug.bind(courseCategoryController),
);

router.get(
  "/admin/all",
  authorize(Role.ADMIN),
  courseCategoryController.getAdminCategories.bind(courseCategoryController),
);
router.post(
  "/admin",
  authorize(Role.ADMIN),
  courseCategoryController.createCategory.bind(courseCategoryController),
);
router.patch(
  "/admin/:id",
  authorize(Role.ADMIN),
  courseCategoryController.updateCategory.bind(courseCategoryController),
);

export default router;
