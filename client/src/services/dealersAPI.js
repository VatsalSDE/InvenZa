import axiosInstance from './axiosInstance';

/**
 * Dealers API Service
 */
export const dealersAPI = {
  /**
   * Get all dealers
   * @returns {Promise<Array>} - List of dealers
   */
  getAll: async () => {
    const response = await axiosInstance.get('/dealers');
    return response.data;
  },

  /**
   * Get dealer by ID
   * @param {number} id - Dealer ID
   * @returns {Promise<Object>} - Dealer data
   */
  getById: async (id) => {
    const response = await axiosInstance.get(`/dealers/${id}`);
    return response.data;
  },

  /**
   * Get dealers with outstanding balances
   * @returns {Promise<Array>} - List of dealers with outstanding balances
   */
  getOutstanding: async () => {
    const response = await axiosInstance.get('/dealers/outstanding');
    return response.data;
  },

  /**
   * Get dealer ledger (orders, payments, balance)
   * @param {number} id - Dealer ID
   * @returns {Promise<Object>} - { orders, payments, totalOrdered, totalPaid, outstandingBalance }
   */
  getLedger: async (id) => {
    const response = await axiosInstance.get(`/dealers/${id}/ledger`);
    return response.data;
  },

  /**
   * Create a new dealer
   * @param {Object} dealer - Dealer data
   * @returns {Promise<Object>} - Created dealer
   */
  create: async (dealer) => {
    const response = await axiosInstance.post('/dealers', dealer);
    return response.data;
  },

  /**
   * Update a dealer
   * @param {number} id - Dealer ID
   * @param {Object} dealer - Updated dealer data
   * @returns {Promise<Object>} - Updated dealer
   */
  update: async (id, dealer) => {
    const response = await axiosInstance.put(`/dealers/${id}`, dealer);
    return response.data;
  },

  /**
   * Delete a dealer
   * @param {number} id - Dealer ID
   * @returns {Promise<Object>} - Deletion result
   */
  delete: async (id) => {
    const response = await axiosInstance.delete(`/dealers/${id}`);
    return response.data;
  },

  /**
   * Get dealer payment behavior scores
   * @returns {Promise<Array>} - List of dealers with scores
   */
  getPaymentScores: async () => {
    const response = await axiosInstance.get('/dealers/payment-scores');
    return response.data?.data || response.data || [];
  },

  /**
   * Get top purchased products for a dealer
   * @param {number} id - Dealer ID
   * @returns {Promise<Array>} - List of top products
   */
  getDealerTopProducts: async (id) => {
    const response = await axiosInstance.get(`/dealers/${id}/top-products`);
    return response.data?.data || response.data || [];
  },
};

export default dealersAPI;
