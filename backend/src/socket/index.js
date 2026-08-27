const { Server } = require('socket.io');

let io = null;

const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      methods: ['GET', 'POST'],
      credentials: true,
    },
    pingTimeout: 60000,
  });

  io.on('connection', (socket) => {
    console.log(`🔌 Socket connected: ${socket.id}`);

    // Client sends { userId, role } to join personal room
    socket.on('join', ({ userId, role }) => {
      if (userId) {
        socket.join(`user:${userId}`);
        socket.join(`role:${role}`);
        console.log(`   User ${userId} joined room user:${userId}`);
      }
    });

    // Admin joins admin room
    socket.on('join:admin', () => {
      socket.join('admin');
    });

    socket.on('disconnect', (reason) => {
      console.log(`🔌 Socket disconnected: ${socket.id} (${reason})`);
    });

    socket.on('error', (err) => {
      console.error('Socket error:', err.message);
    });
  });

  console.log('✅ Socket.IO initialized');
  return io;
};

// Emit to all connected clients (broadcasts like: new listing, new demand)
const emitEvent = (event, data) => {
  if (io) io.emit(event, { ...data, timestamp: new Date().toISOString() });
};

// Emit to a specific user by userId
const emitToUser = (userId, event, data) => {
  if (io) io.to(`user:${userId}`).emit(event, { ...data, timestamp: new Date().toISOString() });
};

// Emit to a role group (e.g. all farmers or all buyers)
const emitToRole = (role, event, data) => {
  if (io) io.to(`role:${role}`).emit(event, { ...data, timestamp: new Date().toISOString() });
};

// Emit to admin room
const emitToAdmin = (event, data) => {
  if (io) io.to('admin').emit(event, { ...data, timestamp: new Date().toISOString() });
};

const getIO = () => io;

module.exports = { initSocket, emitEvent, emitToUser, emitToRole, emitToAdmin, getIO };
