import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import api from '../services/api';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [activeChat, setActiveChat] = useState(null); // { conversation, receiver, item }
  const [unreadCount, setUnreadCount] = useState(0);

  const [notifications, setNotifications] = useState([]);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);

  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const { data } = await api.get('/notifications');
      if (data.success) {
        setNotifications(data.notifications);
        setUnreadNotificationsCount(data.unreadCount);
      }
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    }
  };

  const markNotificationAsRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
      setUnreadNotificationsCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error(err);
    }
  };

  const markAllNotificationsAsRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadNotificationsCount(0);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (!user) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      setNotifications([]);
      setUnreadNotificationsCount(0);
      return;
    }

    fetchNotifications();

    const socketUrl = import.meta.env.VITE_SOCKET_URL || window.location.origin;
    const newSocket = io(socketUrl, {
      path: '/socket.io',
      transports: ['websocket', 'polling']
    });

    newSocket.on('connect', () => {
      console.log('⚡ Connected to Rentify Realtime Socket');
      newSocket.emit('register_user', user._id);
    });

    newSocket.on('online_users', (usersList) => {
      setOnlineUsers(usersList);
    });

    newSocket.on('message_notification', (data) => {
      // If notification is not for the currently open chat drawer
      if (!activeChat || activeChat.conversation?._id !== data.conversationId) {
        setUnreadCount((prev) => prev + 1);
      }
    });

    newSocket.on('new_notification', (notif) => {
      setNotifications((prev) => [notif, ...prev]);
      setUnreadNotificationsCount((prev) => prev + 1);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [user?._id]);

  // Open Chat Drawer directly with another user (e.g. from item details page "Chat Owner")
  const startChatWithOwner = async (owner, item) => {
    if (!user) return;
    try {
      const { data } = await api.post('/chat/conversations', {
        receiverId: owner._id,
        itemId: item?._id
      });

      if (data.success) {
        setActiveChat({
          conversation: data.conversation,
          receiver: owner,
          item: item
        });
      }
    } catch (err) {
      console.error('Error starting chat:', err);
    }
  };

  const closeChat = () => {
    setActiveChat(null);
  };

  return (
    <SocketContext.Provider
      value={{
        socket,
        onlineUsers,
        activeChat,
        setActiveChat,
        startChatWithOwner,
        closeChat,
        unreadCount,
        setUnreadCount,
        notifications,
        unreadNotificationsCount,
        fetchNotifications,
        markNotificationAsRead,
        markAllNotificationsAsRead
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
