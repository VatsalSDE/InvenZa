import { sendError } from '../utils/responseHelper.js';

/**
 * Global error handling middleware
 * Catches all unhandled errors and sends standardized response
 */
export const errorHandler = (err, req, res, next) => {
  // Log error for debugging
  console.error('Error:', {
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    path: req.path,
    method: req.method,
  });

  // Handle specific error types
  if (err.name === 'ValidationError') {
    return sendError(res, 'Validation error', 400, err.errors);
  }

  if (err.name === 'JsonWebTokenError') {
    return sendError(res, 'Invalid token', 401);
  }

  if (err.name === 'TokenExpiredError') {
    return sendError(res, 'Token expired', 401);
  }

  // Supabase errors
  if (err.code && err.code.startsWith('PGRST')) {
    return sendError(res, 'Database error', 500);
  }

  // Handle Supabase specific errors
  if (err.message?.includes('duplicate key')) {
    return sendError(res, 'Resource already exists', 409);
  }

  if (err.message?.includes('foreign key')) {
    return sendError(res, 'Related resource not found', 400);
  }

  // Default error response
  const statusCode = err.statusCode || err.status || 500;
  const message = process.env.NODE_ENV === 'production' 
    ? 'Internal server error' 
    : err.message || 'Internal server error';

  return sendError(res, message, statusCode);
};

/**
 * Not found handler for undefined routes
 */
export const notFoundHandler = (req, res) => {
  return sendError(res, `Route ${req.method} ${req.path} not found`, 404);
};

/**
 * Async handler wrapper to catch errors in async route handlers
 * @param {Function} fn - Async function to wrap
 * @returns {Function} Express middleware function
 */
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

export default { errorHandler, notFoundHandler, asyncHandler };
