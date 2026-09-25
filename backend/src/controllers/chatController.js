import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';
import User from '../models/User.js';

// @desc    Get all conversations for logged-in user
// @route   GET /api/chat/conversations
// @access  Private
const getConversations = async (req, res, next) => {
  try {
    const conversations = await Conversation.find({
      participants: req.user._id
    })
      .populate('participants', 'name avatar email rating location phone')
      .populate('item', 'title pricePerDay images category')
      .sort({ updatedAt: -1 });

    res.status(200).json({
      success: true,
      conversations
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get or create conversation between two users
// @route   POST /api/chat/conversations
// @access  Private
const getOrCreateConversation = async (req, res, next) => {
  try {
    const { receiverId, itemId } = req.body;

    if (!receiverId) {
      return res.status(400).json({
        success: false,
        message: 'Receiver ID is required'
      });
    }

    if (receiverId === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot start a chat with yourself'
      });
    }

    // Check if conversation already exists between these 2 users
    let query = {
      participants: { $all: [req.user._id, receiverId] }
    };

    if (itemId) {
      query.item = itemId;
    }

    let conversation = await Conversation.findOne(query)
      .populate('participants', 'name avatar email rating location phone')
      .populate('item', 'title pricePerDay images category');

    if (!conversation) {
      // Create new conversation
      conversation = await Conversation.create({
        participants: [req.user._id, receiverId],
        item: itemId || null,
        lastMessage: 'Started conversation',
        lastMessageSender: req.user._id,
        lastMessageAt: new Date()
      });

      conversation = await Conversation.findById(conversation._id)
        .populate('participants', 'name avatar email rating location phone')
        .populate('item', 'title pricePerDay images category');
    }

    res.status(200).json({
      success: true,
      conversation
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all messages for a conversation
// @route   GET /api/chat/messages/:conversationId
// @access  Private
const getMessages = async (req, res, next) => {
  try {
    const { conversationId } = req.params;

    const messages = await Message.find({ conversationId })
      .populate('sender', 'name avatar')
      .sort({ createdAt: 1 });

    // Mark messages as read
    await Message.updateMany(
      {
        conversationId,
        receiver: req.user._id,
        read: false
      },
      { read: true }
    );

    res.status(200).json({
      success: true,
      messages
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Send a message (REST fallback + persists in DB)
// @route   POST /api/chat/messages
// @access  Private
const sendMessage = async (req, res, next) => {
  try {
    const { conversationId, receiverId, text } = req.body;

    if (!conversationId || !receiverId || !text) {
      return res.status(400).json({
        success: false,
        message: 'conversationId, receiverId and text are required'
      });
    }

    const message = await Message.create({
      conversationId,
      sender: req.user._id,
      receiver: receiverId,
      text
    });

    // Update conversation last message
    await Conversation.findByIdAndUpdate(conversationId, {
      lastMessage: text,
      lastMessageSender: req.user._id,
      lastMessageAt: new Date()
    });

    const populatedMessage = await Message.findById(message._id).populate(
      'sender',
      'name avatar'
    );

    res.status(201).json({
      success: true,
      message: populatedMessage
    });
  } catch (error) {
    next(error);
  }
};

export {
  getConversations,
  getOrCreateConversation,
  getMessages,
  sendMessage
};

export default {
  getConversations,
  getOrCreateConversation,
  getMessages,
  sendMessage
};
