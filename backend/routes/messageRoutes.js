import express from 'express';
import { getConversations, getMessages, sendMessage, clearChat } from '../controllers/messageController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/conversations', protect, getConversations);
router.get('/:userId', protect, getMessages);
router.delete('/:userId', protect, clearChat);
router.post('/', protect, sendMessage);

export default router;
