import Note from '../models/Note.js';
import Version from '../models/Version.js';
import User from '../models/User.js';

/**
 * Get all notes for current user (owned + shared)
 * GET /api/notes
 */
export const getNotes = async (req, res, next) => {
  try {
    const { filter = 'all', tag, search, sort = 'updatedAt' } = req.query;
    const userId = req.user.id;

    // Build query
    let query = {};

    // Filter: all, owned, shared, trash
    if (filter === 'owned') {
      query.owner = userId;
      query.isDeleted = false;
    } else if (filter === 'shared') {
      query['collaborators.user'] = userId;
      query.isDeleted = false;
    } else if (filter === 'trash') {
      query.owner = userId;
      query.isDeleted = true;
    } else {
      // All non-deleted notes
      query.$or = [
        { owner: userId },
        { 'collaborators.user': userId },
      ];
      query.isDeleted = false;
    }

    // Filter by tag
    if (tag) {
      query.tags = tag;
    }

    // Search by title or content
    if (search) {
      query.$and = [
        query,
        {
          $or: [
            { title: { $regex: search, $options: 'i' } },
            { 'content.ops.insert': { $regex: search, $options: 'i' } },
          ],
        },
      ];
    }

    // Build sort object
    const sortOptions = {};
    sortOptions[sort] = -1;

    // Execute query
    const notes = await Note.find(query)
      .populate('owner', 'name email avatar')
      .populate('collaborators.user', 'name email avatar')
      .sort(sortOptions)
      .limit(50);

    // Get unique tags for sidebar
    const allTags = [...new Set(notes.flatMap((note) => note.tags))];

    res.status(200).json({
      success: true,
      data: {
        notes,
        tags: allTags,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get single note by ID
 * GET /api/notes/:id
 */
export const getNote = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const note = await Note.findById(id)
      .populate('owner', 'name email avatar')
      .populate('collaborators.user', 'name email avatar');

    if (!note) {
      return res.status(404).json({
        success: false,
        message: 'Note not found',
      });
    }

    // Check permission
    if (!note.hasPermission(userId)) {
      console.log('Permission denied:', {
        noteId: id,
        ownerId: note.owner._id.toString(),
        currentUserId: userId,
        currentUserEmail: req.user.email,
        ownerEmail: note.owner.email,
      });
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to view this note',
        ownerId: note.owner._id.toString(),
        currentUserId: userId,
        ownerEmail: note.owner.email,
        currentEmail: req.user.email,
      });
    }

    res.status(200).json({
      success: true,
      data: { note },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create new note
 * POST /api/notes
 */
export const createNote = async (req, res, next) => {
  try {
    const { title, content, tags } = req.body;
    const userId = req.user.id;

    console.log('Creating note:', {
      userId,
      userEmail: req.user.email,
      title,
      hasContent: !!content,
    });

    const note = await Note.create({
      title: title || 'Untitled',
      content: content || { ops: [] },
      owner: userId,
      tags: tags || [],
    });

    // Populate the created note
    await note.populate('owner', 'name email avatar');

    console.log('Note created:', {
      noteId: note._id,
      ownerId: note.owner._id,
      ownerEmail: note.owner.email,
    });

    res.status(201).json({
      success: true,
      message: 'Note created successfully',
      data: { note },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update note
 * PATCH /api/notes/:id
 */
export const updateNote = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, content, tags, saveVersion } = req.body;
    const userId = req.user.id;

    const note = await Note.findById(id);

    if (!note) {
      return res.status(404).json({
        success: false,
        message: 'Note not found',
      });
    }

    // Check edit permission
    if (!note.hasPermission(userId, 'edit')) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to edit this note',
      });
    }

    // Update fields
    if (title !== undefined) note.title = title;
    if (content !== undefined) note.content = content;
    if (tags !== undefined) note.tags = tags;

    await note.save();

    // Save version snapshot if requested
    if (saveVersion) {
      const versionNumber = await Version.getNextVersionNumber(id);
      await Version.create({
        note: id,
        content: note.content,
        savedBy: userId,
        versionNumber,
      });
    }

    // Populate updated note
    await note.populate('owner', 'name email avatar');
    await note.populate('collaborators.user', 'name email avatar');

    res.status(200).json({
      success: true,
      message: 'Note updated successfully',
      data: { note },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete note (soft delete)
 * DELETE /api/notes/:id
 */
export const deleteNote = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const note = await Note.findById(id);

    if (!note) {
      return res.status(404).json({
        success: false,
        message: 'Note not found',
      });
    }

    // Only owner can delete
    if (note.owner.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only the owner can delete this note',
      });
    }

    await note.softDelete();

    res.status(200).json({
      success: true,
      message: 'Note moved to trash',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Restore note from trash
 * POST /api/notes/:id/restore
 */
export const restoreNote = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const note = await Note.findById(id);

    if (!note) {
      return res.status(404).json({
        success: false,
        message: 'Note not found',
      });
    }

    // Only owner can restore
    if (note.owner.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only the owner can restore this note',
      });
    }

    await note.restore();

    res.status(200).json({
      success: true,
      message: 'Note restored successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Permanently delete note
 * DELETE /api/notes/:id/permanent
 */
export const permanentDelete = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const note = await Note.findById(id);

    if (!note) {
      return res.status(404).json({
        success: false,
        message: 'Note not found',
      });
    }

    // Only owner can permanently delete
    if (note.owner.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only the owner can permanently delete this note',
      });
    }

    // Delete associated versions
    await Version.deleteMany({ note: id });

    // Delete note
    await Note.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Note permanently deleted',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Add collaborator to note
 * POST /api/notes/:id/share
 */
export const shareNote = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { email, permission = 'view' } = req.body;
    const userId = req.user.id;

    const note = await Note.findById(id);

    if (!note) {
      return res.status(404).json({
        success: false,
        message: 'Note not found',
      });
    }

    // Only owner can share
    if (note.owner.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only the owner can share this note',
      });
    }

    // Find user by email
    const userToAdd = await User.findOne({ email });
    if (!userToAdd) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Don't add owner as collaborator
    if (userToAdd._id.toString() === userId.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You are already the owner of this note',
      });
    }

    // Check if already a collaborator
    const existingCollab = note.collaborators.find(
      (c) => c.user.toString() === userToAdd._id.toString()
    );

    if (existingCollab) {
      // Update permission
      existingCollab.permission = permission;
    } else {
      // Add new collaborator
      note.collaborators.push({
        user: userToAdd._id,
        permission,
      });
    }

    await note.save();

    await note.populate('collaborators.user', 'name email avatar');

    res.status(200).json({
      success: true,
      message: `Note shared with ${email}`,
      data: { note },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Remove collaborator from note
 * DELETE /api/notes/:id/collaborator/:userId
 */
export const removeCollaborator = async (req, res, next) => {
  try {
    const { id, userId: collaboratorId } = req.params;
    const userId = req.user.id;

    const note = await Note.findById(id);

    if (!note) {
      return res.status(404).json({
        success: false,
        message: 'Note not found',
      });
    }

    // Only owner can remove collaborators
    if (note.owner.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only the owner can remove collaborators',
      });
    }

    note.collaborators = note.collaborators.filter(
      (c) => c.user.toString() !== collaboratorId
    );

    await note.save();

    res.status(200).json({
      success: true,
      message: 'Collaborator removed',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get version history for a note
 * GET /api/notes/:id/versions
 */
export const getVersions = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const note = await Note.findById(id);

    if (!note) {
      return res.status(404).json({
        success: false,
        message: 'Note not found',
      });
    }

    // Check permission
    if (!note.hasPermission(userId)) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to view this note',
      });
    }

    const versions = await Version.getVersionsForNote(id, 20);

    res.status(200).json({
      success: true,
      data: { versions },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get specific version
 * GET /api/notes/:id/versions/:versionId
 */
export const getVersion = async (req, res, next) => {
  try {
    const { id, versionId } = req.params;
    const userId = req.user.id;

    const note = await Note.findById(id);

    if (!note) {
      return res.status(404).json({
        success: false,
        message: 'Note not found',
      });
    }

    // Check permission
    if (!note.hasPermission(userId)) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to view this note',
      });
    }

    const version = await Version.findById(versionId).populate(
      'savedBy',
      'name avatar'
    );

    if (!version) {
      return res.status(404).json({
        success: false,
        message: 'Version not found',
      });
    }

    res.status(200).json({
      success: true,
      data: { version },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Restore note to a specific version
 * POST /api/notes/:id/versions/:versionId/restore
 */
export const restoreVersion = async (req, res, next) => {
  try {
    const { id, versionId } = req.params;
    const userId = req.user.id;

    const note = await Note.findById(id);

    if (!note) {
      return res.status(404).json({
        success: false,
        message: 'Note not found',
      });
    }

    // Check edit permission
    if (!note.hasPermission(userId, 'edit')) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to edit this note',
      });
    }

    const version = await Version.findById(versionId);

    if (!version) {
      return res.status(404).json({
        success: false,
        message: 'Version not found',
      });
    }

    // Save current state as version before restoring
    const currentVersionNumber = await Version.getNextVersionNumber(id);
    await Version.create({
      note: id,
      content: note.content,
      savedBy: userId,
      versionNumber: currentVersionNumber,
    });

    // Restore to selected version
    note.content = version.content;
    await note.save();

    res.status(200).json({
      success: true,
      message: 'Note restored to previous version',
      data: { note },
    });
  } catch (error) {
    next(error);
  }
};
