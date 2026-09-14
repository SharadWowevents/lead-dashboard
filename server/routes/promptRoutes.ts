import { Router } from 'express';
import {
  getPrompts,
  getPromptById,
  createPrompt,
  updatePrompt,
  deletePrompt
} from '../controllers/promptController.ts';
import { authenticateToken } from '../middleware/auth.ts';

const router = Router();

// Public routes for fetching
router.get('/', getPrompts);
router.get('/:id', getPromptById);

// Protected Admin routes (requires Admin JWT)
router.post('/', authenticateToken, createPrompt);
router.put('/:id', authenticateToken, updatePrompt);
router.delete('/:id', authenticateToken, deletePrompt);

export default router;