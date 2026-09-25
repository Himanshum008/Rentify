import Message from '../models/Message.js';
import Conversation from '../models/Conversation.js';

// Track online users: userId -> socketId
const onlineUsers = new Map();

export const initSocket = (io) => {
  io.on('connection', (socket) => {
    console.log(`🔌 New Socket Client Connected: ${socket.id}`);

    // Register user when authenticated client connects
    socket.on('register_user', (userId) => {
      if (!userId) return;
      onlineUsers.set(userId, socket.id);
      socket.userId = userId;
      socket.join(`user_${userId}`);
      console.log(`👤 User Registered Online: ${userId} (Socket: ${socket.id})`);

      // Broadcast list of online user IDs
      io.emit('online_users', Array.from(onlineUsers.keys()));
    });

    // Join a specific conversation room
    socket.on('join_conversation', (conversationId) => {
      socket.join(`conv_${conversationId}`);
      console.log(`💬 Socket ${socket.id} joined conversation: conv_${conversationId}`);
    });

    // Leave a conversation room
    socket.on('leave_conversation', (conversationId) => {
      socket.leave(`conv_${conversationId}`);
      console.log(`🚪 Socket ${socket.id} left conversation: conv_${conversationId}`);
    });

    // Send real-time chat message
    socket.on('send_message', async (data) => {
      try {
        const { conversationId, senderId, receiverId, text } = data;

        if (!conversationId || !senderId || !text) return;

        // Save message to MongoDB
        const newMessage = await Message.create({
          conversationId,
          sender: senderId,
          receiver: receiverId,
          text
        });

        // Update Conversation
        await Conversation.findByIdAndUpdate(conversationId, {
          lastMessage: text,
          lastMessageSender: senderId,
          lastMessageAt: new Date()
        });

        const populatedMessage = await Message.findById(newMessage._id).populate(
          'sender',
          'name avatar'
        );

        // Emit to the conversation room
        io.to(`conv_${conversationId}`).emit('new_message', populatedMessage);

        // Also emit notification directly to the receiver's private room if they are not in the chat
        if (receiverId) {
          io.to(`user_${receiverId}`).emit('message_notification', {
            conversationId,
            message: populatedMessage
          });
        }
      } catch (err) {
        console.error('Socket send_message error:', err);
        socket.emit('error', { message: 'Failed to deliver message' });
      }
    });

    // Typing indicators
    socket.on('typing', ({ conversationId, userId, userName }) => {
      socket.to(`conv_${conversationId}`).emit('user_typing', { userId, userName });
    });

    socket.on('stop_typing', ({ conversationId, userId }) => {
      socket.to(`conv_${conversationId}`).emit('user_stop_typing', { userId });
    });

    // Disconnect handling
    socket.on('disconnect', () => {
      if (socket.userId) {
        onlineUsers.delete(socket.userId);
        io.emit('online_users', Array.from(onlineUsers.keys()));
        console.log(`❌ User Disconnected: ${socket.userId}`);
      }
    });
  });
};

export default { initSocket };
