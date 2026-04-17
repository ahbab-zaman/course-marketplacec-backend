import { Router } from "express";
import authorize from "../../shared/middlewares/authorize.middleware.js";
import { userController } from "./user.controller.js";

const router = Router();

router.use(authorize());

router.get("/me", userController.getMe.bind(userController));
router.patch("/me", userController.updateMe.bind(userController));
router.get("/me/learning", userController.getMyLearning.bind(userController));

export default router;
