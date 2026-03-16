import axiosInstance from './axiosInstance';

/**
 * Products API Service
 */
export const productsAPI = {
  /**
   * Get all products
   * @returns {Promise<Array>} - List of products
   */
  getAll: async () => {
    const response = await axiosInstance.get('/products');
    return response.data;
  },

  /**
   * Get product by ID
   * @param {number} id - Product ID
   * @returns {Promise<Object>} - Product data
   */
  getById: async (id) => {
    const response = await axiosInstance.get(`/products/${id}`);
    return response.data;
  },

  /**
   * Get low stock products
   * @returns {Promise<Array>} - List of low stock products
   */
  getLowStock: async () => {
    const response = await axiosInstance.get('/products/low-stock');
    return response.data;
  },

  /**
   * Create a new product
   * @param {Object} product - Product data
   * @returns {Promise<Object>} - Created product
   */
  create: async (product) => {
    const response = await axiosInstance.post('/products', product);
    return response.data;
  },

  /**
   * Update a product
   * @param {number} id - Product ID
   * @param {Object} product - Updated product data
   * @returns {Promise<Object>} - Updated product
   */
  update: async (id, product) => {
    const response = await axiosInstance.put(`/products/${id}`, product);
    return response.data;
  },

  /**
   * Delete a product
   * @param {number} id - Product ID
   * @returns {Promise<Object>} - Deletion result
   */
  delete: async (id) => {
    const response = await axiosInstance.delete(`/products/${id}`);
    return response.data;
  },

  /**
   * Upload product image to Cloudinary
   * @param {File} file - Image file
   * @returns {Promise<Object>} - { success, image: { url, public_id } }
   */
  uploadImage: async (file) => {
    const formData = new FormData();
    formData.append('image', file);

    const response = await axiosInstance.post('/products/upload-image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    
    return response.data; // Interceptor unwraps {success, data} to data: { image: { ... } }
  },

  /**
   * Bulk import products from CSV
   * @param {Array} products - Array of product objects
   * @returns {Promise<Object>} - Import result
   */
  bulkImport: async (products) => {
    const response = await axiosInstance.post('/products/bulk', { products });
    return response.data;
  },

  /**
   * Cleanup blob URLs (migrate to Cloudinary)
   * @returns {Promise<Object>} - Cleanup result
   */
  /**
   * Get product profitability analysis
   * @returns {Promise<Array>} - List of product stats
   */
  getProductProfitability: async () => {
    const response = await axiosInstance.get('/products/profitability');
    return response.data;
  },
};

export default productsAPI;
