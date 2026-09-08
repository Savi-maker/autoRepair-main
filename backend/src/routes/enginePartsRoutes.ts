import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { listEngineParts } from "../controllers/orderEngineController.js";

const router = Router();
router.get("/", requireAuth, listEngineParts);
export default router;