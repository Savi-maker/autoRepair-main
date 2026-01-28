import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import {
  listCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer
} from "../controllers/customerController.js";

const router = Router();

router.get("/", requireAuth, listCustomers);
router.get("/:id", requireAuth, getCustomerById);
router.post("/", requireAuth, createCustomer);
router.patch("/:id", requireAuth, updateCustomer);
router.delete("/:id", requireAuth, deleteCustomer);

export default router;

