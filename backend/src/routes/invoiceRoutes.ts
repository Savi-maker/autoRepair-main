import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import {
  listInvoices,
  getInvoiceById,
  createInvoice,
  updateInvoice,
  deleteInvoice
} from "../controllers/invoiceController.js";

const router = Router();

router.get("/", requireAuth, listInvoices);
router.get("/:id", requireAuth, getInvoiceById);
router.post("/", requireAuth, createInvoice);
router.patch("/:id", requireAuth, updateInvoice);
router.delete("/:id", requireAuth, deleteInvoice);

export default router;

