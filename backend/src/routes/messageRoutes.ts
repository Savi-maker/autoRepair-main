import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import {
  listThreads,
  getThreadById,
  createThread,
  updateThread,
  deleteThread,
  listMessages,
  createMessage
} from "../controllers/messageController.js";

const router = Router();

// threads
router.get("/threads", requireAuth, listThreads);
router.get("/threads/:id", requireAuth, getThreadById);
router.post("/threads", requireAuth, createThread);
router.patch("/threads/:id", requireAuth, updateThread);
router.delete("/threads/:id", requireAuth, deleteThread);

// messages
router.get("/threads/:threadId/messages", requireAuth, listMessages);
router.post("/threads/:threadId/messages", requireAuth, createMessage);

export default router;

