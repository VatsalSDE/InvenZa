import axiosInstance from './axiosInstance';

/**
 * Dashboard API Service
 */
export const dashboardAPI = {
  /**
   * Get comprehensive dashboard statistics
   * @returns {Promise<Object>} - Dashboard stats
   */
  getStats: async () => {
    try {
      const response = await axiosInstance.get('/dashboard/stats');
      return response.data || {};
    } catch (err) {
      console.error('Failed to fetch dashboard stats:', err);
      return {};
    }
  },

  /**
   * Get sales data for charts
   * @param {string} period - Time period (day, week, month)
   * @returns {Promise<Array>} - Sales data for charts
   */
  getSalesData: async (period = 'month') => {
    try {
      const response = await axiosInstance.get('/dashboard/sales', { params: { period } });
      return Array.isArray(response.data) ? response.data : [];
    } catch (err) {
      console.error('Failed to fetch sales data:', err);
      return [];
    }
  },

  /**
   * Get stock distribution by category
   * @returns {Promise<Array>} - Stock distribution data
   */
  getStockDistribution: async () => {
    try {
      const response = await axiosInstance.get('/dashboard/stock-distribution');
      return Array.isArray(response.data) ? response.data : [];
    } catch (err) {
      console.error('Failed to fetch stock distribution:', err);
      return [];
    }
  },

  /**
   * Get business insights for the 4 Dashboard Cards
   * @returns {Promise<Object>} - Business insights
   */
  getBusinessInsights: async () => {
    try {
      const response = await axiosInstance.get('/dashboard/business-insights');
      return response.data || {};
    } catch (err) {
      console.error('Failed to fetch business insights:', err);
      return {};
    }
  },

  /**
   * Get order patterns for the dashboard chart
   * @returns {Promise<Array>} - Order patterns by day of week
   */
  getOrderPatterns: async () => {
    try {
      const response = await axiosInstance.get('/dashboard/order-patterns');
      return response.data?.data || response.data || [];
    } catch (err) {
      console.error('Failed to fetch order patterns:', err);
      return [];
    }
  },

  /**
   * Get low stock alerts
   * @returns {Promise<Array>} - Low stock products
   */
  getLowStockAlerts: async () => {
    try {
      const response = await axiosInstance.get('/products/low-stock');
      return Array.isArray(response.data) ? response.data : [];
    } catch (err) {
      console.error('Failed to fetch low stock alerts:', err);
      return [];
    }
  },

  /**
   * Get top selling items
   * @returns {Promise<Array>} - Top selling products
   */
  getTopSellingItems: async () => {
    try {
      const statsResponse = await axiosInstance.get('/dashboard/stats');
      return statsResponse.data?.topSellingProducts || [];
    } catch {
      return [];
    }
  },

  /**
   * Get recent activities
   * @returns {Promise<Array>} - Recent orders/activities
   */
  getRecentActivities: async () => {
    try {
      const statsResponse = await axiosInstance.get('/dashboard/stats');
      return statsResponse.data?.recentActivities || [];
    } catch {
      return [];
    }
  },
};

export default dashboardAPI;
