import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import {
  listAppointments,
  getAppointmentById,
  createAppointment,
  updateAppointment,
  deleteAppointment
} from "../controllers/appointmentController.js";

const router = Router();

router.get("/", requireAuth, listAppointments);
router.get("/:id", requireAuth, getAppointmentById);
router.post("/", requireAuth, createAppointment);
router.patch("/:id", requireAuth, updateAppointment);
router.delete("/:id", requireAuth, deleteAppointment);

export default router;

