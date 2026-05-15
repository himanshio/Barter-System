import express from "express";
import {
  getRecommendedUsers,
  getUserProfile,
  getUserWallet,
  getUpcomingSessions,
  uploadAvatar,
  updateUserLocation,
  getUserConnections,
  searchUsers,
  updateProfile,
} from "../controllers/userController.js";
import { protect } from "../middleware/authMiddleware.js";
import { upload } from "../config/cloudinary.js";

const router = express.Router();

router.get("/search", protect, searchUsers);
router.get("/recommendations", protect, getRecommendedUsers);
router.get("/profile", protect, getUserProfile);
router.put("/profile", protect, updateProfile);
router.get("/wallet", protect, getUserWallet);
router.get("/sessions", protect, getUpcomingSessions);
router.get("/connections", protect, getUserConnections);
router.post("/avatar", protect, upload.single("avatar"), uploadAvatar);
router.patch("/location", protect, updateUserLocation);

export default router;
