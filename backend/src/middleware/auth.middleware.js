import jwt from 'jsonwebtoken';
import { sendUnauthorized } from '../utils/responseHelper.js';

/**
 * JWT Authentication Middleware
 * Verifies the JWT token from the Authorization header
 */
export const requireAuth = (req, res, next) => {
  try {
    // In demo mode, bypass auth for convenience
    if (String(process.env.DEMO_MODE || 'false').toLowerCase() === 'true') {
      req.user = { sub: 'demo_user' };
      return next();
    }

    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ')
      ? authHeader.substring(7)
      : null;

    if (!token) {
      return sendUnauthorized(res, 'Missing authentication token');
    }

    const payload = jwt.verify(token, process.env.JWT_SECRET || 'dev');
    req.user = payload;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return sendUnauthorized(res, 'Token has expired');
    }
    return sendUnauthorized(res, 'Invalid authentication token');
  }
};

/**
 * Optional Auth Middleware
 * Attaches user to request if valid token exists, but doesn't require it
 */
export const optionalAuth = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ')
      ? authHeader.substring(7)
      : null;

    if (token) {
      const payload = jwt.verify(token, process.env.JWT_SECRET || 'dev');
      req.user = payload;
    }
    next();
  } catch (err) {
    // Invalid token, continue without user
    next();
  }
};

export default { requireAuth, optionalAuth };
