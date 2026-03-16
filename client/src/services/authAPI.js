import axiosInstance from './axiosInstance';

/**
 * Authentication API Service
 */
export const authAPI = {
  /**
   * Login with username and password
   * @param {Object} credentials - { username, password }
   * @returns {Promise} - { token, user }
   */
  login: async (credentials) => {
    const response = await axiosInstance.post('/auth/login', credentials);
    return response.data;
  },

  /**
   * Verify current JWT token
   * @returns {Promise} - { valid: boolean, user }
   */
  verify: async () => {
    const response = await axiosInstance.get('/auth/verify');
    return response.data;
  },

  /**
   * Change password
   * @param {Object} data - { current_password, new_password }
   * @returns {Promise} - { success: boolean, message }
   */
  changePassword: async (data) => {
    const response = await axiosInstance.post('/auth/change-password', data);
    return response.data;
  },
};

export default authAPI;
