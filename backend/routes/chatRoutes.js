// routes/chatRoutes.js

import express from "express";
import { chatWithAI } from "../controllers/chatController.js";
import { optionalAuth } from "../middlewares/optionalAuth.js";

const router = express.Router();

router.post("/chat", optionalAuth, chatWithAI);

export default router;