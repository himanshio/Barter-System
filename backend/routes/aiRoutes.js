import express from "express";
import { generateBio, analyzeMatch } from "../controllers/aiController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/bio", protect, generateBio);
router.post("/match", protect, analyzeMatch);

export default router;
