
import Message from '../models/Message.js';
import ChatRoom from '../models/ChatRoom.js';
import User from '../models/User.js'; // To fetch user details if needed

const initializeSocketHandlers = (io) => {
  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);

    socket.on('joinRoom', async ({ roomIdString, userId }) => {
      try {
        const user = await User.findById(userId).select('fullName'); // Fetch user for senderName
        if (!user) {
          console.warn(`User ${userId} not found for joining room ${roomIdString}`);
          socket.emit('socketError', { message: `User ${userId} not found.`});
          return;
        }
        
        const room = await ChatRoom.findOne({ roomIdString });
        if (!room) {
          console.warn(`ChatRoom ${roomIdString} not found for user ${socket.id} to join.`);
          socket.emit('socketError', { message: `Chat room ${roomIdString} not found.`});
          return;
        }

        socket.join(roomIdString);
        console.log(`User ${user.fullName} (${socket.id}) joined room: ${roomIdString}`);

        // Optional: Send a system message to the room that a user has joined
        const systemMessage = {
          id: Date.now().toString() + '_system', // Temporary unique ID
          chatRoom: room._id,
          chatRoomIdString: roomIdString,
          text: `${user.fullName} has joined the chat.`,
          senderType: 'SYSTEM',
          senderName: 'System',
          timestamp: new Date()
        };
        // io.to(roomIdString).emit('newChatMessage', systemMessage); // Emit to all in room
        // For now, let's not send system messages on join to reduce noise. Can be enabled later.

        socket.emit('joinedRoom', { roomIdString, message: `Successfully joined ${room.name}` });

      } catch (error) {
        console.error(`Error joining room ${roomIdString} for user ${socket.id}:`, error);
        socket.emit('socketError', { message: `Error joining room: ${error.message}`});
      }
    });

    socket.on('leaveRoom', ({ roomIdString, userId }) => {
      socket.leave(roomIdString);
      console.log(`User ${userId} (${socket.id}) left room: ${roomIdString}`);
      // Optional: Notify others (e.g., for 'user has left' message or updating user list)
      // io.to(roomIdString).emit('userLeft', { userId, roomIdString });
    });

    socket.on('chatMessage', async (data) => {
      // data: { roomIdString: string, text: string, senderId: string, senderType: 'USER' }
      const { roomIdString, text, senderId, senderType = 'USER' } = data;

      if (!roomIdString || !text || !senderId) {
        console.warn("chatMessage event received with missing data:", data);
        socket.emit('socketError', { message: 'Message data is incomplete.'});
        return;
      }

      try {
        const room = await ChatRoom.findOne({ roomIdString });
        if (!room) {
          console.warn(`ChatRoom ${roomIdString} not found for message from ${senderId}.`);
          socket.emit('socketError', { message: `Chat room ${roomIdString} not found.`});
          return;
        }

        const sender = await User.findById(senderId).select('fullName');
        if (!sender) {
          console.warn(`Sender User ${senderId} not found for message in room ${roomIdString}.`);
          socket.emit('socketError', { message: `Sender user ${senderId} not found.`});
          return;
        }
        
        const newMessage = new Message({
          chatRoom: room._id,
          chatRoomIdString: roomIdString,
          text,
          sender: sender._id,
          senderType: senderType, // Should be 'USER' if coming from client directly
          senderName: sender.fullName,
          timestamp: new Date(),
        });

        await newMessage.save();
        
        // Populate sender details for the client
        const populatedMessage = {
            _id: newMessage._id,
            chatRoom: newMessage.chatRoom,
            chatRoomIdString: newMessage.chatRoomIdString,
            text: newMessage.text,
            sender: { // Send limited sender info
                _id: sender._id,
                fullName: sender.fullName,
            },
            senderType: newMessage.senderType,
            senderName: newMessage.senderName,
            timestamp: newMessage.timestamp,
            createdAt: newMessage.createdAt, // Mongoose adds this
            updatedAt: newMessage.updatedAt  // Mongoose adds this
        };


        // Broadcast the message to everyone in the room (including the sender)
        io.to(roomIdString).emit('newChatMessage', populatedMessage);
        console.log(`Message from ${sender.fullName} to room ${roomIdString}: ${text}`);

      } catch (error) {
        console.error(`Error processing chat message in room ${roomIdString}:`, error);
        socket.emit('socketError', { message: `Error sending message: ${error.message}`});
      }
    });
    
    socket.on('typing', ({ roomIdString, userName, isTyping }) => {
        if (roomIdString && userName) {
            socket.to(roomIdString).emit('userTyping', { userName, isTyping, roomIdString });
        }
    });

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.id}`);
      // Here, you might want to find which rooms the user was in and emit 'userLeft'
      // This requires keeping track of socket.id to room mappings, or iterating through io.sockets.adapter.rooms
    });
  });
};

export default initializeSocketHandlers;
