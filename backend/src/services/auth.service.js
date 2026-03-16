import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import supabase from '../config/supabase.js';

/**
 * Auth Service
 * Handles authentication logic and Supabase queries
 */

/**
 * Authenticate user with username and password
 * @param {string} username - User's username
 * @param {string} password - User's password
 * @returns {Object} Token and user info
 */
export const login = async (username, password) => {
  // Validate inputs
  if (!username || !password) {
    throw { statusCode: 400, message: 'Username and password are required' };
  }

  // Fetch user from database
  const { data: users, error } = await supabase
    .from('login')
    .select('username, password')
    .eq('username', username)
    .limit(1);

  if (error) {
    console.error('Database error during login:', error);
    throw { statusCode: 500, message: 'Database error during authentication' };
  }

  if (!users || users.length === 0) {
    throw { statusCode: 401, message: 'Invalid credentials' };
  }

  const user = users[0];

  // Verify password
  const isValidPassword = await bcrypt.compare(password, user.password);
  if (!isValidPassword) {
    throw { statusCode: 401, message: 'Invalid credentials' };
  }

  // Generate JWT token
  const token = jwt.sign(
    { sub: user.username },
    process.env.JWT_SECRET || 'dev',
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

  return {
    token,
    username: user.username,
  };
};

/**
 * Change password for a user
 * @param {string} username - User's username
 * @param {string} currentPassword - Current password
 * @param {string} newPassword - New password
 * @returns {boolean} Success status
 */
export const changePassword = async (username, currentPassword, newPassword) => {
  // Validate inputs
  if (!username || !currentPassword || !newPassword) {
    throw { statusCode: 400, message: 'All fields are required' };
  }

  if (newPassword.length < 6) {
    throw { statusCode: 400, message: 'New password must be at least 6 characters' };
  }

  // Fetch current user
  const { data: users, error: fetchError } = await supabase
    .from('login')
    .select('username, password')
    .eq('username', username)
    .limit(1);

  if (fetchError || !users || users.length === 0) {
    throw { statusCode: 404, message: 'User not found' };
  }

  const user = users[0];

  // Verify current password
  const isValidPassword = await bcrypt.compare(currentPassword, user.password);
  if (!isValidPassword) {
    throw { statusCode: 401, message: 'Current password is incorrect' };
  }

  // Hash new password
  const hashedPassword = await bcrypt.hash(newPassword, 10);

  // Update password
  const { error: updateError } = await supabase
    .from('login')
    .update({ password: hashedPassword })
    .eq('username', username);

  if (updateError) {
    console.error('Error updating password:', updateError);
    throw { statusCode: 500, message: 'Failed to update password' };
  }

  return true;
};

/**
 * Verify a JWT token
 * @param {string} token - JWT token to verify
 * @returns {Object} Decoded payload
 */
export const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET || 'dev');
  } catch (err) {
    throw { statusCode: 401, message: 'Invalid or expired token' };
  }
};

export default {
  login,
  changePassword,
  verifyToken,
};
