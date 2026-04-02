import { Router } from "express";
import { CategoryController } from "./category.controller";
import { Role } from "@prisma/client";
import { createUploader } from "../../middlewares/upload.middleware";
import authorize from "../../shared/middlewares/authorize.middleware";

const router = Router();
const categoryController = new CategoryController();

// Use the dynamic uploader factory for categories
const upload = createUploader("categories");

// ── Public Routes ──────────────────────────────────────────────────────────
// Rules: Return only APPROVED, Exclude deletedAt, Paginated
router.get("/", categoryController.getPublicCategories);
router.get("/:slug", categoryController.getCategoryBySlug);

// ── Admin Routes ───────────────────────────────────────────────────────────
// Rules: Only ADMIN can create, update, approve, reject, delete categories.
router.use("/admin", authorize(Role.ADMIN));

router.post("/admin", upload.single("icon"), categoryController.createCategory);

router.get("/admin/all", categoryController.getAllAdminCategories);

router.get("/admin/:id", categoryController.getAdminCategoryById);

router.patch(
  "/admin/:id",
  upload.single("icon"),
  categoryController.updateCategory,
);

router.patch("/admin/:id/approve", categoryController.approveCategory);

router.patch("/admin/:id/reject", categoryController.rejectCategory);

router.delete("/admin/:id", categoryController.deleteCategory);

export default router;
