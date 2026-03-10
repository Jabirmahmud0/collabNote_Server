import { roomManager } from './roomManager.js';
import { presenceTracker } from './presenceTracker.js';

/**
 * Initialize Socket.IO event handlers
 */
export const initializeSocket = (io) => {
  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    /**
     * Join a note room for real-time collaboration
     */
    socket.on('join-room', ({ noteId, userId, userName, userColor }) => {
      if (!noteId || !userId) {
        socket.emit('error', { message: 'noteId and userId are required' });
        return;
      }

      // Join the room
      socket.join(noteId);
      socket.data.noteId = noteId;
      socket.data.userId = userId;
      socket.data.userName = userName;
      socket.data.userColor = userColor || getRandomColor();

      // Add user to presence tracker
      presenceTracker.addUser(noteId, {
        userId,
        userName,
        socketId: socket.id,
        color: socket.data.userColor,
      });

      // Get all users in the room
      const users = presenceTracker.getUsers(noteId);

      // Send current users to the joined user
      socket.emit('room-users', users);

      // Broadcast to others that a user joined
      socket.to(noteId).emit('user-joined', {
        userId,
        userName,
        color: socket.data.userColor,
      });

      console.log(`User ${userId} (${userName}) joined room ${noteId}`);
    });

    /**
     * Leave a note room
     */
    socket.on('leave-room', ({ noteId, userId }) => {
      if (noteId) {
        socket.leave(noteId);
        presenceTracker.removeUser(noteId, socket.id);

        // Broadcast to others that a user left
        socket.to(noteId).emit('user-left', { userId, socketId: socket.id });

        console.log(`User ${userId} left room ${noteId}`);
      }
    });

    /**
     * Broadcast note content changes (Quill delta)
     */
    socket.on('note-change', ({ noteId, delta, userId }) => {
      if (!noteId || !delta) return;

      // Broadcast to all other users in the room
      socket.to(noteId).emit('note-update', {
        delta,
        userId,
      });
    });

    /**
     * Broadcast cursor position
     */
    socket.on('cursor-move', ({ noteId, userId, range, userName }) => {
      if (!noteId || !userId) return;

      const userColor = socket.data.userColor || '#6366F1';

      socket.to(noteId).emit('cursor-update', {
        userId,
        range,
        color: userColor,
        name: userName || 'Anonymous',
      });
    });

    /**
     * Typing indicator
     */
    socket.on('user-typing', ({ noteId, userId, userName }) => {
      if (!noteId) return;

      socket.to(noteId).emit('typing-indicator', {
        userId,
        name: userName || 'Someone',
      });
    });

    /**
     * Stop typing indicator
     */
    socket.on('user-stop-typing', ({ noteId, userId }) => {
      if (!noteId) return;

      socket.to(noteId).emit('stop-typing', { userId });
    });

    /**
     * Handle disconnection
     */
    socket.on('disconnect', () => {
      const noteId = socket.data.noteId;
      const userId = socket.data.userId;

      if (noteId) {
        presenceTracker.removeUser(noteId, socket.id);
        socket.to(noteId).emit('user-left', { userId, socketId: socket.id });
      }

      console.log(`Socket disconnected: ${socket.id}`);
    });

    /**
     * Handle errors
     */
    socket.on('error', (error) => {
      console.error(`Socket error for ${socket.id}:`, error);
    });
  });
};

/**
 * Generate a random color for cursor/selection
 */
function getRandomColor() {
  const colors = [
    '#EF4444', // red
    '#F97316', // orange
    '#F59E0B', // amber
    '#22C55E', // green
    '#06B6D4', // cyan
    '#3B82F6', // blue
    '#6366F1', // indigo
    '#8B5CF6', // violet
    '#EC4899', // pink
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}
