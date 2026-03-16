import * as authService from '../services/auth.service.js';
import { sendSuccess, sendError } from '../utils/responseHelper.js';

/**
 * Auth Controller
 * Handles authentication-related HTTP requests
 */

/**
 * Login endpoint
 * POST /api/auth/login
 */
export const login = async (req, res, next) => {
  try {
    const { username, password } = req.body;
    const result = await authService.login(username, password);
    return sendSuccess(res, result, 200, 'Login successful');
  } catch (error) {
    if (error.statusCode) {
      return sendError(res, error.message, error.statusCode);
    }
    next(error);
  }
};

/**
 * Change password endpoint
 * POST /api/auth/change-password
 */
export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const username = req.user?.sub;

    if (!username) {
      return sendError(res, 'User not authenticated', 401);
    }

    await authService.changePassword(username, currentPassword, newPassword);
    return sendSuccess(res, null, 200, 'Password changed successfully');
  } catch (error) {
    if (error.statusCode) {
      return sendError(res, error.message, error.statusCode);
    }
    next(error);
  }
};

/**
 * Verify token endpoint
 * GET /api/auth/verify
 */
export const verifyToken = async (req, res, next) => {
  try {
    return sendSuccess(res, { 
      valid: true, 
      user: req.user 
    });
  } catch (error) {
    next(error);
  }
};

export default {
  login,
  changePassword,
  verifyToken,
};
