import axiosInstance from './axiosInstance';

/**
 * Suppliers API Service
 */
export const suppliersAPI = {
  /**
   * Get all non-archived suppliers with models
   * @returns {Promise<Array>} - List of suppliers
   */
  getAll: async () => {
    const response = await axiosInstance.get('/suppliers');
    return response.data;
  },

  /**
   * Get active suppliers for dropdowns
   * @returns {Promise<Array>} - List of active suppliers
   */
  getActive: async () => {
    const response = await axiosInstance.get('/suppliers/active');
    return response.data;
  },

  /**
   * Get archived suppliers
   * @returns {Promise<Array>} - List of archived suppliers
   */
  getArchived: async () => {
    const response = await axiosInstance.get('/suppliers/archived');
    return response.data;
  },

  /**
   * Get supplier by ID
   * @param {number} id - Supplier ID
   * @returns {Promise<Object>} - Supplier data with models
   */
  getById: async (id) => {
    const response = await axiosInstance.get(`/suppliers/${id}`);
    return response.data;
  },

  /**
   * Create a new supplier with models
   * @param {Object} supplier - Supplier data with models array
   * @returns {Promise<Object>} - Created supplier
   */
  create: async (supplier) => {
    const response = await axiosInstance.post('/suppliers', supplier);
    return response.data;
  },

  /**
   * Update supplier and models
   * @param {number} id - Supplier ID
   * @param {Object} supplier - Updated supplier data with models
   * @returns {Promise<Object>} - Updated supplier
   */
  update: async (id, supplier) => {
    const response = await axiosInstance.put(`/suppliers/${id}`, supplier);
    return response.data;
  },

  /**
   * Soft delete (archive) a supplier
   * @param {number} id - Supplier ID
   * @returns {Promise<Object>} - Deletion result
   */
  archive: async (id) => {
    const response = await axiosInstance.delete(`/suppliers/${id}`);
    return response.data;
  },

  /**
   * Restore an archived supplier
   * @param {number} id - Supplier ID
   * @returns {Promise<Object>} - Restore result
   */
  restore: async (id) => {
    const response = await axiosInstance.post(`/suppliers/${id}/restore`);
    return response.data;
  },

  /**
   * Get supplier ledger (purchase history)
   * @param {number} id - Supplier ID
   * @returns {Promise<Array>} - List of purchases
   */
  getSupplierLedger: async (id) => {
    const response = await axiosInstance.get(`/suppliers/${id}/ledger`);
    return response.data;
  },

  /**
   * Get supplier models (auto-mapped)
   * @param {number} id - Supplier ID
   * @returns {Promise<Array>} - List of models
   */
  getSupplierModels: async (id) => {
    const response = await axiosInstance.get(`/suppliers/${id}/models`);
    return response.data;
  },
};

export default suppliersAPI;
