import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import {
  listSchedule,
  createSchedule,
  updateSchedule,
  deleteSchedule,
} from "../controllers/scheduleController.js";

const router = Router();

router.get("/", requireAuth, listSchedule);
router.post("/", requireAuth, createSchedule);
router.patch("/:id", requireAuth, updateSchedule);
router.delete("/:id", requireAuth, deleteSchedule);

export default router;
