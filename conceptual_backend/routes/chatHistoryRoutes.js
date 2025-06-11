import express from 'express';
import Message from '../models/Message.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Debug route to list all chat histories
router.get('/debug/all', async (req, res) => {
  try {
    const messages = await Message.find({})
      .sort({ timestamp: -1 })
      .populate('sender', 'fullName');
    res.status(200).json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Save chat history
router.post('/', protect, async (req, res) => {
  try {
    // Messages are already saved by socket handler
    res.status(200).json({ message: 'Messages are saved via socket handler' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get chat history
router.get('/:room', protect, async (req, res) => {
  try {
    const messages = await Message.find({
      chatRoomIdString: req.params.room
    })
      .sort({ timestamp: -1 })
      .populate('sender', 'fullName');
    
    res.status(200).json(messages || []);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;