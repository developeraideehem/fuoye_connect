
import mongoose from 'mongoose';

const chatRoomSchema = new mongoose.Schema({
  name: { // e.g., "Computer Engineering" or "Faculty of Science"
    type: String,
    required: true,
    trim: true,
  },
  roomIdString: { // e.g., "dept_comp_eng" or "faculty_sci"
    type: String,
    required: true,
    unique: true, // This will be the ID used in URLs and for joining rooms
  },
  type: {
    type: String,
    enum: ['department', 'faculty', 'general'], // 'general' for things like "FUOYE General Chat"
    required: true,
  },
  // Reference to the faculty or department this chat room belongs to, if applicable
  referenceId: { // Could be Faculty._id or Department._id depending on type
    type: mongoose.Schema.Types.ObjectId,
    // refPath: 'onModel' // Dynamically reference based on 'type'
    // For simplicity, we might not strictly enforce refPath here if roomIdString is primary key
  },
  // onModel: { // For dynamic referencing with referenceId
  //   type: String,
  //   required: function() { return this.type === 'department' || this.type === 'faculty'; },
  //   enum: ['Department', 'Faculty']
  // },
  description: {
    type: String,
    trim: true,
  },
  isPublic: { // For future use, e.g. direct message rooms vs public rooms
    type: Boolean,
    default: true,
  }
}, { timestamps: true });

const ChatRoom = mongoose.model('ChatRoom', chatRoomSchema);
export default ChatRoom;
