import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import {
  listVehicles,
  getVehicleById,
  createVehicle,
  updateVehicle,
  deleteVehicle
} from "../controllers/vehicleController.js";

const router = Router();

router.get("/", requireAuth, listVehicles);
router.get("/:id", requireAuth, getVehicleById);
router.post("/", requireAuth, createVehicle);
router.patch("/:id", requireAuth, updateVehicle);
router.delete("/:id", requireAuth, deleteVehicle);

export default router;

