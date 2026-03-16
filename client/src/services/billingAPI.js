import axiosInstance from './axiosInstance';

/**
 * Billing API Service
 */
export const billingAPI = {
  /**
   * Get bill data for an order
   * @param {number} orderId - Order ID
   * @returns {Promise<Object>} - Bill data
   */
  getBillData: async (orderId) => {
    const response = await axiosInstance.get(`/billing/order/${orderId}`);
    return response.data;
  },

  /**
   * Generate bill preview (HTML)
   * @param {number} orderId - Order ID
   * @returns {Promise<Object>} - Bill preview HTML
   */
  getPreview: async (orderId) => {
    const response = await axiosInstance.get(`/billing/preview/${orderId}`);
    return response.data;
  },

  /**
   * Download bill as HTML file
   * @param {number} orderId - Order ID
   * @returns {Promise<Object>} - Bill HTML content
   */
  downloadBill: async (orderId) => {
    const response = await axiosInstance.get(`/billing/download/${orderId}`);
    return response.data;
  },

  /**
   * Send bill via email
   * @param {Object} data - { order_id, email }
   * @returns {Promise<Object>} - Send result
   */
  sendEmail: async (data) => {
    const response = await axiosInstance.post('/billing/send-email', data);
    return response.data;
  },
};

export default billingAPI;
