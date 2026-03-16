import axiosInstance from './axiosInstance';

/**
 * AI API Service
 */
export const aiAPI = {
    /**
     * Business Anomaly Detection (Dashboard)
     */
    getAnomalyCheck: async () => {
        const response = await axiosInstance.get('/ai/anomaly-check');
        return response.data;
    },

    /**
     * Dealer Risk Analysis (Dealers Page)
     */
    getDealerRiskScores: async () => {
        const response = await axiosInstance.get('/ai/dealer-risk-scores');
        return response.data;
    },

    /**
     * Smart Restock Suggestions (Inventory Page)
     */
    getRestockSuggestions: async () => {
        const response = await axiosInstance.get('/ai/restock-suggestions');
        return response.data;
    },

    /**
     * AI Morning Business Digest (Dashboard)
     */
    getMorningDigest: async () => {
        const response = await axiosInstance.get('/ai/morning-digest');
        return response.data;
    }
};

export default aiAPI;
