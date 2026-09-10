import { Router } from 'express';
import { login, changePassword, getProfile } from '../controllers/authController.ts';
import { authenticateToken } from '../middleware/auth.ts';

const router = Router();

// Public authentication endpoint
router.post('/login', login);

// Protected endpoints requiring valid JWT
router.post('/change-password', authenticateToken, changePassword);
router.get('/me', authenticateToken, getProfile);

export default router;
