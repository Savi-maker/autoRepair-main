import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import {
  listNotifications,
  getNotificationById,
  createNotification,
  markRead,
  markAllRead,
  deleteNotification
} from "../controllers/notificationController.js";

const router = Router();

router.get("/", requireAuth, listNotifications);
router.get("/:id", requireAuth, getNotificationById);


router.post("/", requireAuth, createNotification);


router.patch("/:id/read", requireAuth, markRead);
router.patch("/read-all", requireAuth, markAllRead);

router.delete("/:id", requireAuth, deleteNotification);

export default router;

