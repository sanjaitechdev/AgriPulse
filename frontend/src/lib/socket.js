import { io } from 'socket.io-client';

let socket = null;

export const connectSocket = (userId, role) => {
  if (socket?.connected) return socket;

  socket = io('/', {
    transports: ['websocket', 'polling'],
    autoConnect: true,
  });

  socket.on('connect', () => {
    console.log('🔌 Socket connected:', socket.id);
    socket.emit('join', { userId, role });
    if (role === 'admin') socket.emit('join:admin');
  });

  socket.on('disconnect', (reason) => {
    console.log('🔌 Socket disconnected:', reason);
  });

  socket.on('connect_error', (err) => {
    console.warn('Socket connection error:', err.message);
  });

  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const getSocket = () => socket;

export const onSocketEvent = (event, handler) => {
  if (socket) socket.on(event, handler);
};

export const offSocketEvent = (event, handler) => {
  if (socket) socket.off(event, handler);
};
