import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import {
  listAdminUsers,
  createAdminUser,
  updateAdminUser,
  adminResetPassword,
} from "../controllers/adminUsers.controller.js";

const router = Router();

router.get("/users", requireAuth, listAdminUsers);
router.post("/users", requireAuth, createAdminUser);
router.patch("/users/:id", requireAuth, updateAdminUser);
router.post("/users/reset-password", requireAuth, adminResetPassword);

export default router;

