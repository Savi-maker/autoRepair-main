import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { listAnalytics } from "../controllers/analyticsController.js";

const router = Router();

router.get("/", requireAuth, listAnalytics);

export default router;
