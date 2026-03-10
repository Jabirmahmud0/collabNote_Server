/**
 * Presence Tracker - Tracks online users per note
 */
class PresenceTracker {
  constructor() {
    // Map of noteId -> Map of socketId -> userInfo
    this.presence = new Map();
  }

  /**
   * Add user to a note's presence list
   */
  addUser(noteId, userInfo) {
    if (!this.presence.has(noteId)) {
      this.presence.set(noteId, new Map());
    }
    this.presence.get(noteId).set(userInfo.socketId, {
      userId: userInfo.userId,
      userName: userInfo.userName,
      color: userInfo.color,
      joinedAt: new Date(),
    });
  }

  /**
   * Remove user from a note's presence list
   */
  removeUser(noteId, socketId) {
    const notePresence = this.presence.get(noteId);
    if (notePresence) {
      notePresence.delete(socketId);
      if (notePresence.size === 0) {
        this.presence.delete(noteId);
      }
    }
  }

  /**
   * Get all users in a note
   */
  getUsers(noteId) {
    const notePresence = this.presence.get(noteId);
    if (!notePresence) return [];

    return Array.from(notePresence.values()).map((user) => ({
      userId: user.userId,
      userName: user.userName,
      color: user.color,
      joinedAt: user.joinedAt,
    }));
  }

  /**
   * Get user count in a note
   */
  getUserCount(noteId) {
    const notePresence = this.presence.get(noteId);
    return notePresence ? notePresence.size : 0;
  }

  /**
   * Get specific user's presence
   */
  getUserPresence(noteId, socketId) {
    const notePresence = this.presence.get(noteId);
    if (!notePresence) return null;
    return notePresence.get(socketId) || null;
  }

  /**
   * Update user's cursor position
   */
  updateCursor(noteId, socketId, range) {
    const notePresence = this.presence.get(noteId);
    if (notePresence && notePresence.has(socketId)) {
      const user = notePresence.get(socketId);
      user.range = range;
      user.lastActive = new Date();
    }
  }

  /**
   * Get users with cursor positions
   */
  getUsersWithCursors(noteId) {
    const users = this.getUsers(noteId);
    const notePresence = this.presence.get(noteId);

    if (notePresence) {
      return users.map((user) => {
        const userData = Array.from(notePresence.values()).find(
          (u) => u.userId === user.userId
        );
        return {
          ...user,
          range: userData?.range || null,
        };
      });
    }

    return users;
  }

  /**
   * Clean up stale presences (users inactive for > 5 minutes)
   */
  cleanup(maxAge = 5 * 60 * 1000) {
    const now = Date.now();
    for (const [noteId, users] of this.presence.entries()) {
      for (const [socketId, user] of users.entries()) {
        if (user.lastActive && now - user.lastActive.getTime() > maxAge) {
          users.delete(socketId);
        }
      }
      if (users.size === 0) {
        this.presence.delete(noteId);
      }
    }
  }
}

export const presenceTracker = new PresenceTracker();
