import { Role } from "@prisma/client";
import { Router } from "express";
import authorize from "../../shared/middlewares/authorize.middleware.js";
import optionalAuthorize from "../../shared/middlewares/optional-authorize.middleware.js";
import { lessonController } from "./lesson.controller.js";

const router = Router();

router.get(
  "/courses/:courseId/lessons",
  optionalAuthorize(),
  lessonController.getCourseLessons.bind(lessonController),
);
router.post(
  "/courses/:courseId/lessons",
  authorize(Role.INSTRUCTOR, Role.ADMIN),
  lessonController.createLesson.bind(lessonController),
);

router.patch(
  "/lessons/:id",
  authorize(Role.INSTRUCTOR, Role.ADMIN),
  lessonController.updateLesson.bind(lessonController),
);
router.delete(
  "/lessons/:id",
  authorize(Role.INSTRUCTOR, Role.ADMIN),
  lessonController.deleteLesson.bind(lessonController),
);
router.get(
  "/lessons/:lessonId/playback",
  optionalAuthorize(),
  lessonController.getPlayback.bind(lessonController),
);

export default router;
