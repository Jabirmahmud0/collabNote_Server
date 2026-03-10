import express from 'express';
import {
  getNotes,
  getNote,
  createNote,
  updateNote,
  deleteNote,
  restoreNote,
  permanentDelete,
  shareNote,
  removeCollaborator,
  getVersions,
  getVersion,
  restoreVersion,
} from '../controllers/noteController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

/**
 * @route   GET /api/notes
 * @desc    Get all notes for current user
 * @access  Private
 */
router.get('/', getNotes);

/**
 * @route   POST /api/notes
 * @desc    Create new note
 * @access  Private
 */
router.post('/', createNote);

/**
 * @route   GET /api/notes/:id
 * @desc    Get single note by ID
 * @access  Private
 */
router.get('/:id', getNote);

/**
 * @route   PATCH /api/notes/:id
 * @desc    Update note
 * @access  Private
 */
router.patch('/:id', updateNote);

/**
 * @route   DELETE /api/notes/:id
 * @desc    Delete note (soft delete)
 * @access  Private
 */
router.delete('/:id', deleteNote);

/**
 * @route   POST /api/notes/:id/restore
 * @desc    Restore note from trash
 * @access  Private
 */
router.post('/:id/restore', restoreNote);

/**
 * @route   DELETE /api/notes/:id/permanent
 * @desc    Permanently delete note
 * @access  Private
 */
router.delete('/:id/permanent', permanentDelete);

/**
 * @route   POST /api/notes/:id/share
 * @desc    Add collaborator to note
 * @access  Private
 */
router.post('/:id/share', shareNote);

/**
 * @route   DELETE /api/notes/:id/collaborator/:userId
 * @desc    Remove collaborator from note
 * @access  Private
 */
router.delete('/:id/collaborator/:userId', removeCollaborator);

/**
 * @route   GET /api/notes/:id/versions
 * @desc    Get version history for a note
 * @access  Private
 */
router.get('/:id/versions', getVersions);

/**
 * @route   GET /api/notes/:id/versions/:versionId
 * @desc    Get specific version
 * @access  Private
 */
router.get('/:id/versions/:versionId', getVersion);

/**
 * @route   POST /api/notes/:id/versions/:versionId/restore
 * @desc    Restore note to a specific version
 * @access  Private
 */
router.post('/:id/versions/:versionId/restore', restoreVersion);

export default router;
