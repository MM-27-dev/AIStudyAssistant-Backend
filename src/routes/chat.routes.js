import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
  createSession,
  getUserSessions,
  getSessionMessages,
  sendMessage,
  // provideSessionFeedback,
  endSessionAndGenerateTitle,
  sendFileMessage,
  getToken,
} from "../controllers/chat.controller.js";
import { uploadMultipleFiles, uploadSingleFile } from "../middlewares/multer.middleware.js";

const router = Router();

// ---------- Protected Routes ----------
router.post("/session", verifyJWT, createSession); // Create new session
router.get("/sessions", verifyJWT, getUserSessions); // List user's sessions
router.get("/session/:sessionId/messages", verifyJWT, getSessionMessages);

router.post("/session/:sessionId/message", verifyJWT, sendMessage); // Send a message in session
router.post("/session/:sessionId/end", verifyJWT, endSessionAndGenerateTitle); // Update session title
// router.post("/session/:sessionId/feedback", verifyJWT, provideSessionFeedback); // Add feedback

router.post(
  "/session/:sessionId/message/file",
  verifyJWT,
  uploadSingleFile,
  sendFileMessage
);

router.post("/openai/token", verifyJWT, getToken);

export default router;
