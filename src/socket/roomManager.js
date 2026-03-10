/**
 * Room Manager - Handles Socket.IO room operations
 */
class RoomManager {
  constructor() {
    // Map of noteId -> Set of socketIds
    this.rooms = new Map();
  }

  /**
   * Add socket to a room
   */
  addToRoom(noteId, socketId) {
    if (!this.rooms.has(noteId)) {
      this.rooms.set(noteId, new Set());
    }
    this.rooms.get(noteId).add(socketId);
  }

  /**
   * Remove socket from a room
   */
  removeFromRoom(noteId, socketId) {
    const room = this.rooms.get(noteId);
    if (room) {
      room.delete(socketId);
      if (room.size === 0) {
        this.rooms.delete(noteId);
      }
    }
  }

  /**
   * Get all socket IDs in a room
   */
  getRoomSockets(noteId) {
    const room = this.rooms.get(noteId);
    return room ? Array.from(room) : [];
  }

  /**
   * Get room size
   */
  getRoomSize(noteId) {
    const room = this.rooms.get(noteId);
    return room ? room.size : 0;
  }

  /**
   * Check if room exists
   */
  hasRoom(noteId) {
    return this.rooms.has(noteId);
  }

  /**
   * Get all rooms
   */
  getAllRooms() {
    return Array.from(this.rooms.entries()).map(([noteId, sockets]) => ({
      noteId,
      userCount: sockets.size,
    }));
  }

  /**
   * Clean up empty rooms
   */
  cleanup() {
    for (const [noteId, sockets] of this.rooms.entries()) {
      if (sockets.size === 0) {
        this.rooms.delete(noteId);
      }
    }
  }
}

export const roomManager = new RoomManager();
