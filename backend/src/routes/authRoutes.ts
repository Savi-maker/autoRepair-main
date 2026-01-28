import { Router } from "express";
import { login, register, resetPassword } from "../controllers/authController.js";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.post("/reset", resetPassword);

export default router;

