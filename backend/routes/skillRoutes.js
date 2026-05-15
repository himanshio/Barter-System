import express from 'express';
import { getSkills, createSkill } from '../controllers/skillController.js';
import { protect } from '../middleware/authMiddleware.js';
import { upload } from '../config/cloudinary.js';

const router = express.Router();

router.route('/')
    .get(getSkills)
    .post(protect, upload.single('image'), createSkill);

export default router;
