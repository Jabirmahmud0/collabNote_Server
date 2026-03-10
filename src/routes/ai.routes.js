import express from 'express';
import { summarizeNote, generateTags } from '../controllers/aiController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

/**
 * @route   POST /api/ai/summarize
 * @desc    Summarize note content
 * @access  Private
 */
router.post('/summarize', summarizeNote);

/**
 * @route   POST /api/ai/tags
 * @desc    Auto-generate tags for note
 * @access  Private
 */
router.post('/tags', generateTags);

export default router;
