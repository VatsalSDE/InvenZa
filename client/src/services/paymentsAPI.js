import axiosInstance from './axiosInstance';

/**
 * Payments API Service
 */
export const paymentsAPI = {
  /**
   * Get all payments
   * @returns {Promise<Array>} - List of payments
   */
  getAll: async () => {
    const response = await axiosInstance.get('/payments');
    return response.data;
  },

  /**
   * Get payment by ID
   * @param {number} id - Payment ID
   * @returns {Promise<Object>} - Payment data
   */
  getById: async (id) => {
    const response = await axiosInstance.get(`/payments/${id}`);
    return response.data;
  },

  /**
   * Get payments for an order
   * @param {number} orderId - Order ID
   * @returns {Promise<Array>} - List of payments for the order
   */
  getByOrder: async (orderId) => {
    const response = await axiosInstance.get(`/payments/order/${orderId}`);
    return response.data;
  },

  /**
   * Get next payment code
   * @returns {Promise<Object>} - { code: string }
   */
  getNextCode: async () => {
    const response = await axiosInstance.get('/payments/next-code');
    return response.data;
  },

  /**
   * Create a new payment
   * @param {Object} payment - Payment data
   * @returns {Promise<Object>} - Created payment
   */
  create: async (payment) => {
    const response = await axiosInstance.post('/payments', payment);
    return response.data;
  },

  /**
   * Update a payment
   * @param {number} id - Payment ID
   * @param {Object} payment - Updated payment data
   * @returns {Promise<Object>} - Updated payment
   */
  update: async (id, payment) => {
    const response = await axiosInstance.put(`/payments/${id}`, payment);
    return response.data;
  },

  /**
   * Delete a payment
   * @param {number} id - Payment ID
   * @returns {Promise<Object>} - Deletion result
   */
  delete: async (id) => {
    const response = await axiosInstance.delete(`/payments/${id}`);
    return response.data;
  },
};

export default paymentsAPI;