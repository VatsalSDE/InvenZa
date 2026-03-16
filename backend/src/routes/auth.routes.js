import { Router } from 'express';
import * as authController from '../controllers/auth.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = Router();

/**
 * Auth Routes
 * POST /api/auth/login - Login with username and password
 * POST /api/auth/change-password - Change password (requires auth)
 * GET /api/auth/verify - Verify JWT token (requires auth)
 */

// Public routes
router.post('/login', authController.login);

// Protected routes
router.post('/change-password', requireAuth, authController.changePassword);
router.get('/verify', requireAuth, authController.verifyToken);

export default router;
