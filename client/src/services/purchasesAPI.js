import axiosInstance from './axiosInstance';

/**
 * Purchases API Service
 */
export const purchasesAPI = {
  /**
   * Get all purchases with supplier info
   * @returns {Promise<Array>} - List of purchases
   */
  getAll: async () => {
    const response = await axiosInstance.get('/purchases');
    return response.data;
  },

  /**
   * Get purchase by ID with items
   * @param {number} id - Purchase ID
   * @returns {Promise<Object>} - Purchase data with items
   */
  getById: async (id) => {
    const response = await axiosInstance.get(`/purchases/${id}`);
    return response.data;
  },

  /**
   * Get purchase items
   * @param {number} id - Purchase ID
   * @returns {Promise<Array>} - List of purchase items
   */
  getItems: async (id) => {
    const response = await axiosInstance.get(`/purchases/${id}/items`);
    return response.data;
  },

  /**
   * Get purchases by supplier
   * @param {number} supplierId - Supplier ID
   * @returns {Promise<Array>} - List of purchases
   */
  getBySupplier: async (supplierId) => {
    const response = await axiosInstance.get(`/purchases/supplier/${supplierId}`);
    return response.data;
  },

  /**
   * Get next purchase code
   * @returns {Promise<Object>} - { code: string }
   */
  getNextCode: async () => {
    const response = await axiosInstance.get('/purchases/next-code');
    return response.data;
  },

  /**
   * Create a new purchase with items
   * @param {Object} purchase - Purchase data with items array
   * @returns {Promise<Object>} - Created purchase
   */
  create: async (purchase) => {
    const response = await axiosInstance.post('/purchases', purchase);
    return response.data;
  },

  /**
   * Update a purchase
   * @param {number} id - Purchase ID
   * @param {Object} purchase - Updated purchase data
   * @returns {Promise<Object>} - Updated purchase
   */
  update: async (id, purchase) => {
    const response = await axiosInstance.put(`/purchases/${id}`, purchase);
    return response.data;
  },

  /**
   * Update purchase status (triggers stock increase if Received)
   * @param {number} id - Purchase ID
   * @param {string} status - New status (pending, received)
   * @returns {Promise<Object>} - Updated purchase
   */
  updateStatus: async (id, status) => {
    const response = await axiosInstance.put(`/purchases/${id}/status`, { status });
    return response.data;
  },

  /**
   * Delete a purchase
   * @param {number} id - Purchase ID
   * @returns {Promise<Object>} - Deletion result
   */
  delete: async (id) => {
    const response = await axiosInstance.delete(`/purchases/${id}`);
    return response.data;
  },
};

export default purchasesAPI;
