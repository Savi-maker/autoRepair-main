import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { listMechanics } from "../controllers/userController.js";

const router = Router();

router.get("/mechanics", requireAuth, listMechanics);

export default router;
