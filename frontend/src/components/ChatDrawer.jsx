import React, { useState, useEffect, useRef } from 'react';
import { X, Send, User, Circle, Image as ImageIcon, Phone } from 'lucide-react';
import { FaUserCircle } from 'react-icons/fa';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const ChatDrawer = () => {
  const { activeChat, closeChat, socket, onlineUsers } = useSocket();
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [typingUser, setTypingUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const conversation = activeChat?.conversation;
  const receiver = activeChat?.receiver;
  const item = activeChat?.item || conversation?.item;

  const isOnline = receiver && onlineUsers.includes(receiver._id);

  // Load message history when activeChat changes
  useEffect(() => {
    if (!conversation?._id) return;

    const fetchMessages = async () => {
      setLoading(true);
      try {
        const { data } = await api.get(`/chat/messages/${conversation._id}`);
        if (data.success) {
          setMessages(data.messages);
        }
      } catch (err) {
        console.error('Failed to load chat messages:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();

    // Join conversation socket room
    if (socket) {
      socket.emit('join_conversation', conversation._id);
    }

    return () => {
      if (socket) {
        socket.emit('leave_conversation', conversation._id);
      }
    };
  }, [conversation?._id, socket]);

  // Socket listener for new incoming messages and typing
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (newMessage) => {
      if (newMessage.conversationId === conversation?._id) {
        setMessages((prev) => [...prev, newMessage]);
      }
    };

    const handleTyping = (data) => {
      if (data.userId !== user?._id) {
        setTypingUser(data.userName);
      }
    };

    const handleStopTyping = () => {
      setTypingUser(null);
    };

    socket.on('new_message', handleNewMessage);
    socket.on('user_typing', handleTyping);
    socket.on('user_stop_typing', handleStopTyping);

    return () => {
      socket.off('new_message', handleNewMessage);
      socket.off('user_typing', handleTyping);
      socket.off('user_stop_typing', handleStopTyping);
    };
  }, [socket, conversation?._id, user?._id]);

  // Auto scroll down
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typingUser]);

  if (!activeChat || !receiver) return null;

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const textToSend = inputText.trim();
    setInputText('');

    if (socket) {
      socket.emit('stop_typing', { conversationId: conversation._id, userId: user._id });
      // Emit real-time message via socket
      socket.emit('send_message', {
        conversationId: conversation._id,
        senderId: user._id,
        receiverId: receiver._id,
        text: textToSend
      });
    } else {
      // Fallback to REST API
      try {
        const { data } = await api.post('/chat/messages', {
          conversationId: conversation._id,
          receiverId: receiver._id,
          text: textToSend
        });
        if (data.success) {
          setMessages((prev) => [...prev, data.message]);
        }
      } catch (err) {
        console.error('Send message failed:', err);
      }
    }
  };

  const handleInputChange = (e) => {
    setInputText(e.target.value);
    if (socket && conversation?._id) {
      socket.emit('typing', {
        conversationId: conversation._id,
        userId: user._id,
        userName: user.name
      });
    }
  };

  return (
    <div className="chat-drawer">
      {/* Header */}
      <div className="chat-header">
        <div className="chat-user-status">
          {receiver.avatar ? (
            <img
              src={receiver.avatar}
              alt={receiver.name}
              className="chat-avatar"
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
          ) : (
            <FaUserCircle size={38} color="#e2e8f0" style={{ marginRight: '8px' }} />
          )}
          <div>
            <div style={{ fontWeight: 700, fontSize: '15px' }}>{receiver.name}</div>
            {receiver.phone && (
              <div style={{ fontSize: '12px', fontWeight: 600, color: 'rgba(255, 255, 255, 0.95)', display: 'flex', alignItems: 'center', gap: '4px', margin: '2px 0' }}>
                <Phone size={12} />
                <span>{receiver.phone}</span>
              </div>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', opacity: 0.9 }}>
              <Circle size={8} fill={isOnline ? '#4ade80' : '#cbd5e1'} color={isOnline ? '#4ade80' : '#cbd5e1'} />
              <span>{isOnline ? 'Active Now' : 'Offline'}</span>
            </div>
          </div>
        </div>
        <button
          onClick={closeChat}
          style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', padding: '4px' }}
        >
          <X size={20} />
        </button>
      </div>

      {/* Item Context Banner (if item present) */}
      {item && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#eff6ff', padding: '8px 14px', borderBottom: '1px solid #dbeafe', fontSize: '12px' }}>
          <img
            src={item.images?.[0] || 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=100&q=80'}
            alt={item.title}
            style={{ width: '32px', height: '32px', objectFit: 'cover', borderRadius: '4px' }}
          />
          <div style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            <span style={{ fontWeight: 600 }}>{item.title}</span>
            <span style={{ color: 'var(--primary)', fontWeight: 700, marginLeft: '6px' }}>
              ₹{item.pricePerDay?.toLocaleString('en-IN')}/day
            </span>
          </div>
        </div>
      )}

      {/* Messages Stream */}
      <div className="chat-body">
        {loading ? (
          <div style={{ textAlign: 'center', color: 'var(--text-light)', fontSize: '13px', margin: 'auto' }}>
            Loading conversation...
          </div>
        ) : messages.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px', margin: 'auto', padding: '20px' }}>
            👋 Say hello to <strong>{receiver.name}</strong> and ask about item availability or pickup details!
          </div>
        ) : (
          messages.map((msg, idx) => {
            const isMe = (msg.sender?._id || msg.sender) === user?._id;
            return (
              <div
                key={msg._id || idx}
                className={`message-bubble ${isMe ? 'message-outgoing' : 'message-incoming'}`}
              >
                <div>{msg.text}</div>
                <div
                  style={{
                    fontSize: '10px',
                    opacity: 0.7,
                    textAlign: isMe ? 'right' : 'left',
                    marginTop: '4px'
                  }}
                >
                  {new Date(msg.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            );
          })
        )}

        {typingUser && (
          <div style={{ fontSize: '12px', fontStyle: 'italic', color: 'var(--text-light)', padding: '2px 8px' }}>
            {typingUser} is typing...
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Message Input Footer */}
      <form onSubmit={handleSendMessage} className="chat-footer">
        <input
          type="text"
          value={inputText}
          onChange={handleInputChange}
          placeholder="Type a message..."
          className="chat-input"
        />
        <button type="submit" className="chat-send-btn" disabled={!inputText.trim()}>
          <Send size={16} />
        </button>
      </form>
    </div>
  );
};

export default ChatDrawer;
