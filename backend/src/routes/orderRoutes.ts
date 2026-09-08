import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { listOrders, getOrderById, createOrder, updateOrder } from "../controllers/orderController.js";
import { readOrderEngineEntries, writeOrderEngineEntry } from "../controllers/orderEngineController.js";

const router = Router();

router.get("/", requireAuth, listOrders);
router.get("/:id", requireAuth, getOrderById);
router.get("/:id/engine-entries", requireAuth, readOrderEngineEntries);
router.post("/:id/engine-entries", requireAuth, writeOrderEngineEntry);
router.post("/", requireAuth, createOrder);
router.patch("/:id", requireAuth, updateOrder);

export default router;

