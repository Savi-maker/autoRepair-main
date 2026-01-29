import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import {
  listSuppliers,
  getSupplierById,
  createSupplier,
  updateSupplier,
  deleteSupplier,
} from "../controllers/suppliersController.js";

const router = Router();

router.get("/", requireAuth, listSuppliers);
router.get("/:id", requireAuth, getSupplierById);
router.post("/", requireAuth, createSupplier);
router.patch("/:id", requireAuth, updateSupplier);
router.delete("/:id", requireAuth, deleteSupplier);

export default router;
