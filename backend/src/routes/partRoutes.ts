import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import {
  listParts,
  getPartById,
  createPart,
  updatePart,
  deletePart,
  lowStockParts
} from "../controllers/partController.js";

const router = Router();

router.get("/", requireAuth, listParts);
router.get("/low-stock", requireAuth, lowStockParts);
router.get("/:id", requireAuth, getPartById);
router.post("/", requireAuth, createPart);
router.patch("/:id", requireAuth, updatePart);
router.delete("/:id", requireAuth, deletePart);

export default router;

