
import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  chatRoom: { // Reference to the ChatRoom ObjectId
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ChatRoom',
    required: true,
  },
  chatRoomIdString: { // Denormalized roomIdString from ChatRoom for easier querying if needed
    type: String,
    required: true,
    index: true,
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  senderType: { // From types.ts: USER, OTHER_USER, BOT, SYSTEM
    type: String,
    required: true,
    enum: ['USER', 'OTHER_USER', 'BOT', 'SYSTEM'] // Keep consistent with frontend types
  },
  senderName: { // Denormalized for display, though frontend can also use user.fullName
    type: String,
    required: true,
  },
  text: {
    type: String,
    required: true,
    trim: true,
  },
  timestamp: { // Already handled by mongoose {timestamps: true} for createdAt
    type: Date,
    default: Date.now,
  }
}, { timestamps: true }); // Adds createdAt and updatedAt

const Message = mongoose.model('Message', messageSchema);
export default Message;
