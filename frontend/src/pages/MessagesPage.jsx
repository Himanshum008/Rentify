import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, Send, Circle, User, Search, Package, Phone, ArrowLeft } from 'lucide-react';
import { FaUserCircle } from 'react-icons/fa';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';

const MessagesPage = () => {
  const { user, openAuthModal } = useAuth();
  const { socket, onlineUsers } = useSocket();

  const [conversations, setConversations] = useState([]);
  const [selectedConv, setSelectedConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [typingUser, setTypingUser] = useState(null);
  const [showChatOnMobile, setShowChatOnMobile] = useState(false);
  const messagesEndRef = useRef(null);

  // Load conversations
  useEffect(() => {
    if (!user) return;

    const fetchConversations = async () => {
      setLoading(true);
      try {
        const { data } = await api.get('/chat/conversations');
        if (data.success) {
          setConversations(data.conversations);
          if (data.conversations.length > 0) {
            setSelectedConv(data.conversations[0]);
          }
        }
      } catch (err) {
        console.error('Failed to load conversations:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchConversations();
  }, [user]);

  // Load messages when selected conversation changes
  useEffect(() => {
    if (!selectedConv?._id) return;

    const fetchMessages = async () => {
      try {
        const { data } = await api.get(`/chat/messages/${selectedConv._id}`);
        if (data.success) {
          setMessages(data.messages);
        }
      } catch (err) {
        console.error('Failed to load messages:', err);
      }
    };

    fetchMessages();

    if (socket) {
      socket.emit('join_conversation', selectedConv._id);
    }

    return () => {
      if (socket) {
        socket.emit('leave_conversation', selectedConv._id);
      }
    };
  }, [selectedConv?._id, socket]);

  // Real-time socket message listeners
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (newMsg) => {
      if (newMsg.conversationId === selectedConv?._id) {
        setMessages((prev) => [...prev, newMsg]);
      }
      // Update last message in conversation list
      setConversations((prev) =>
        prev.map((c) =>
          c._id === newMsg.conversationId
            ? { ...c, lastMessage: newMsg.text, lastMessageAt: new Date() }
            : c
        )
      );
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
  }, [socket, selectedConv?._id, user?._id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typingUser]);

  if (!user) {
    return (
      <div className="container" style={{ padding: '80px 0', textAlign: 'center' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '12px' }}>Please Log In</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>Log in to access your real-time chat inbox.</p>
        <button onClick={() => openAuthModal('login')} className="btn btn-primary btn-lg">Log In</button>
      </div>
    );
  }

  const getOtherParticipant = (conv) => {
    return conv.participants.find((p) => p._id !== user._id) || conv.participants[0];
  };

  const otherUser = selectedConv ? getOtherParticipant(selectedConv) : null;
  const isOnline = otherUser && onlineUsers.includes(otherUser._id);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputText.trim() || !selectedConv || !otherUser) return;

    const textToSend = inputText.trim();
    setInputText('');

    if (socket) {
      socket.emit('stop_typing', { conversationId: selectedConv._id, userId: user._id });
      socket.emit('send_message', {
        conversationId: selectedConv._id,
        senderId: user._id,
        receiverId: otherUser._id,
        text: textToSend
      });
    } else {
      try {
        const { data } = await api.post('/chat/messages', {
          conversationId: selectedConv._id,
          receiverId: otherUser._id,
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

  return (
    <div className="container" style={{ padding: '32px 0 80px 0' }}>
      <h1 style={{ fontSize: '28px', fontWeight: 800, marginBottom: '24px' }}>Real-Time Messages</h1>

      <div className="messages-page-layout">
        {/* Left: Conversations Sidebar */}
        <div className={`messages-sidebar-panel ${showChatOnMobile ? 'hidden-mobile' : ''}`}>
          <div style={{ padding: '16px', borderBottom: '1px solid var(--border-light)', fontWeight: 700, fontSize: '16px' }}>
            Conversations ({conversations.length})
          </div>

          <div style={{ flex: 1, overflowY: 'auto' }}>
            {loading ? (
              <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading...</div>
            ) : conversations.length === 0 ? (
              <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                No conversations yet. Chat owners directly from item detail pages!
              </div>
            ) : (
              conversations.map((conv) => {
                const participant = getOtherParticipant(conv);
                const isSelected = selectedConv?._id === conv._id;
                const userOnline = onlineUsers.includes(participant._id);

                return (
                  <div
                    key={conv._id}
                    onClick={() => {
                      setSelectedConv(conv);
                      setShowChatOnMobile(true);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '14px 16px',
                      cursor: 'pointer',
                      borderBottom: '1px solid var(--border-subtle)',
                      background: isSelected ? 'var(--primary-light)' : 'transparent',
                      transition: 'background 0.15s ease'
                    }}
                  >
                    <div style={{ position: 'relative' }}>
                      {participant.avatar ? (
                        <img
                          src={participant.avatar}
                          alt={participant.name}
                          style={{ width: '42px', height: '42px', borderRadius: '50%', objectFit: 'cover' }}
                          onError={(e) => {
                            e.target.style.display = 'none';
                          }}
                        />
                      ) : (
                        <FaUserCircle size={42} color="#94a3b8" />
                      )}
                      {userOnline && (
                        <div
                          style={{
                            position: 'absolute',
                            bottom: '0',
                            right: '0',
                            width: '12px',
                            height: '12px',
                            borderRadius: '50%',
                            background: '#10b981',
                            border: '2px solid white'
                          }}
                        />
                      )}
                    </div>

                    <div style={{ flex: 1, overflow: 'hidden' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                        <span style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-main)' }}>{participant.name}</span>
                        <span style={{ fontSize: '11px', color: 'var(--text-light)' }}>
                          {new Date(conv.lastMessageAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {conv.lastMessage || 'Start a conversation'}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right: Active Chat Window */}
        {selectedConv && otherUser ? (
          <div className={`messages-chat-panel ${!showChatOnMobile ? 'hidden-mobile' : ''}`}>
            {/* Header */}
            <div style={{ padding: '14px 20px', background: 'white', borderBottom: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <button
                  type="button"
                  className="mobile-chat-back-btn"
                  onClick={() => setShowChatOnMobile(false)}
                >
                  <ArrowLeft size={16} />
                  <span>Chats</span>
                </button>
                {otherUser.avatar ? (
                  <img
                    src={otherUser.avatar}
                    alt={otherUser.name}
                    style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }}
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                ) : (
                  <FaUserCircle size={40} color="#94a3b8" />
                )}
                <div>
                  <div style={{ fontWeight: 700, fontSize: '16px' }}>{otherUser.name}</div>
                  {otherUser.phone && (
                    <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '4px', margin: '2px 0' }}>
                      <Phone size={12} />
                      <span>{otherUser.phone}</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: isOnline ? '#059669' : 'var(--text-light)' }}>
                    <Circle size={8} fill={isOnline ? '#10b981' : '#cbd5e1'} color={isOnline ? '#10b981' : '#cbd5e1'} />
                    <span>{isOnline ? 'Online' : 'Offline'}</span>
                  </div>
                </div>
              </div>

              {selectedConv.item && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--primary-light)', padding: '6px 12px', borderRadius: 'var(--radius-md)', fontSize: '12px' }}>
                  <Package size={14} color="var(--primary)" />
                  <span style={{ fontWeight: 600 }}>{selectedConv.item.title}</span>
                  <span style={{ color: 'var(--primary)', fontWeight: 700 }}>₹{selectedConv.item.pricePerDay}/day</span>
                </div>
              )}
            </div>

            {/* Messages Body */}
            <div style={{ flex: 1, padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {messages.map((msg, idx) => {
                const isMe = (msg.sender?._id || msg.sender) === user._id;
                return (
                  <div
                    key={msg._id || idx}
                    className={`message-bubble ${isMe ? 'message-outgoing' : 'message-incoming'}`}
                  >
                    <div>{msg.text}</div>
                    <div style={{ fontSize: '10px', opacity: 0.7, textAlign: isMe ? 'right' : 'left', marginTop: '4px' }}>
                      {new Date(msg.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                );
              })}

              {typingUser && (
                <div style={{ fontSize: '12px', fontStyle: 'italic', color: 'var(--text-light)', padding: '4px 8px' }}>
                  {typingUser} is typing...
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Send Input */}
            <form onSubmit={handleSendMessage} style={{ padding: '14px 20px', background: 'white', borderTop: '1px solid var(--border-light)', display: 'flex', gap: '12px', alignItems: 'center' }}>
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Type your message..."
                className="form-input"
                style={{ flex: 1 }}
              />
              <button type="submit" className="btn btn-primary" disabled={!inputText.trim()}>
                <Send size={16} />
                <span>Send</span>
              </button>
            </form>
          </div>
        ) : (
          <div className={`messages-chat-panel ${!showChatOnMobile ? 'hidden-mobile' : ''}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
            Select a conversation to start chatting.
          </div>
        )}
      </div>
    </div>
  );
};

export default MessagesPage;
