
import express from 'express';
import Message from '../models/Message.js';
import ChatRoom from '../models/ChatRoom.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// GET /api/chat/rooms
// Lists all available public chat rooms
router.get('/rooms', protect, async (req, res) => {
  try {
    const rooms = await ChatRoom.find({ isPublic: true }).sort({ type: 1, name: 1 });
    res.json(rooms);
  } catch (error) {
    console.error("Error fetching chat rooms:", error);
    res.status(500).json({ message: 'Server error fetching chat rooms', error: error.message });
  }
});


// GET /api/chat/:roomIdString/messages
// Fetches messages for a specific chat room using its roomIdString
router.get('/:roomIdString/messages', protect, async (req, res) => {
  const { roomIdString } = req.params;
  const limit = parseInt(req.query.limit) || 50; // Default to 50 messages
  const before = req.query.before ? new Date(req.query.before) : null; // For pagination (older messages)

  try {
    const chatRoom = await ChatRoom.findOne({ roomIdString });
    if (!chatRoom) {
      return res.status(404).json({ message: 'Chat room not found' });
    }

    let query = { chatRoom: chatRoom._id };
    if (before) {
      query.createdAt = { $lt: before };
    }

    const messages = await Message.find(query)
      .populate('sender', 'fullName email role') // Populate sender details
      .sort({ createdAt: -1 }) // Get latest messages first, or use 1 for oldest
      .limit(limit);

    res.json(messages.reverse()); // Reverse to show oldest first in the batch if that's preferred for display
  } catch (error) {
    console.error(`Error fetching messages for room ${roomIdString}:`, error);
    res.status(500).json({ message: 'Server error fetching messages', error: error.message });
  }
});


// POST /api/chat/:roomIdString/messages (Primarily for non-WebSocket message sending or if needed)
// Note: Real-time messages are typically handled via WebSockets. This could be a fallback or for specific use cases.
router.post('/:roomIdString/messages', protect, async (req, res) => {
    const { roomIdString } = req.params;
    const { text } = req.body;
    const sender = req.user._id; // User from 'protect' middleware

    if (!text || text.trim() === "") {
        return res.status(400).json({ message: "Message text cannot be empty." });
    }

    try {
        const chatRoom = await ChatRoom.findOne({ roomIdString });
        if (!chatRoom) {
            return res.status(404).json({ message: 'Chat room not found' });
        }

        const newMessage = new Message({
            chatRoom: chatRoom._id,
            chatRoomIdString: chatRoom.roomIdString,
            sender: sender,
            senderType: 'USER', // Assuming a human user sending via HTTP
            senderName: req.user.fullName,
            text: text
        });

        await newMessage.save();
        const populatedMessage = await Message.findById(newMessage._id).populate('sender', 'fullName email role');

        // Here you might also want to emit this message via Socket.IO if this POST endpoint is used
        // const io = req.app.get('socketio'); // If io is attached to app
        // io.to(roomIdString).emit('newChatMessage', populatedMessage);

        res.status(201).json(populatedMessage);
    } catch (error) {
        console.error(`Error posting message to room ${roomIdString}:`, error);
        res.status(500).json({ message: 'Server error posting message', error: error.message });
    }
});


export default router;
