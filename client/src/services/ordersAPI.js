import axiosInstance from './axiosInstance';

/**
 * Orders API Service
 */
export const ordersAPI = {
  /**
   * Get all orders
   * @returns {Promise<Array>} - List of orders
   */
  getAll: async () => {
    const response = await axiosInstance.get('/orders');
    return response.data;
  },

  /**
   * Get order by ID
   * @param {number} id - Order ID
   * @returns {Promise<Object>} - Order data
   */
  getById: async (id) => {
    const response = await axiosInstance.get(`/orders/${id}`);
    return response.data;
  },

  /**
   * Get order items
   * @param {number} id - Order ID
   * @returns {Promise<Array>} - List of order items
   */
  getItems: async (id) => {
    const response = await axiosInstance.get(`/orders/${id}/items`);
    return response.data;
  },

  /**
   * Get next order code
   * @returns {Promise<Object>} - { code: string }
   */
  getNextCode: async () => {
    const response = await axiosInstance.get('/orders/next-code');
    return response.data;
  },

  /**
   * Create a new order with items
   * @param {Object} order - Order data with items array
   * @returns {Promise<Object>} - Created order
   */
  create: async (order) => {
    const response = await axiosInstance.post('/orders', order);
    return response.data;
  },

  /**
   * Update an order
   * @param {number} id - Order ID
   * @param {Object} order - Updated order data with items
   * @returns {Promise<Object>} - Updated order
   */
  update: async (id, order) => {
    const response = await axiosInstance.put(`/orders/${id}`, order);
    return response.data;
  },

  /**
   * Update order status
   * @param {number} id - Order ID
   * @param {string} status - New status (Pending, Processing, Completed, Cancelled)
   * @returns {Promise<Object>} - Updated order
   */
  updateStatus: async (id, status) => {
    const response = await axiosInstance.put(`/orders/${id}/status`, { order_status: status });
    return response.data;
  },

  /**
   * Delete an order
   * @param {number} id - Order ID
   * @returns {Promise<Object>} - Deletion result
   */
  delete: async (id) => {
    const response = await axiosInstance.delete(`/orders/${id}`);
    return response.data;
  },
};

export default ordersAPI;
