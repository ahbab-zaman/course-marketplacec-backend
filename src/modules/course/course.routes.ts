import { Role } from "@prisma/client";
import { Router } from "express";
import authorize from "../../shared/middlewares/authorize.middleware";
import { courseController } from "./course.controller";

const router = Router();

router.get("/", courseController.getPublicCourses.bind(courseController));
router.get(
  "/me",
  authorize(Role.INSTRUCTOR, Role.ADMIN),
  courseController.getMyCourses.bind(courseController),
);
router.get(
  "/:slugOrId",
  courseController.getPublicCourseDetail.bind(courseController),
);

router.post(
  "/",
  authorize(Role.INSTRUCTOR, Role.ADMIN),
  courseController.createCourse.bind(courseController),
);
router.patch(
  "/:id",
  authorize(Role.INSTRUCTOR, Role.ADMIN),
  courseController.updateCourse.bind(courseController),
);
router.delete(
  "/:id",
  authorize(Role.INSTRUCTOR, Role.ADMIN),
  courseController.deleteCourse.bind(courseController),
);
router.post(
  "/:id/submit",
  authorize(Role.INSTRUCTOR, Role.ADMIN),
  courseController.submitCourseForReview.bind(courseController),
);

export default router;
