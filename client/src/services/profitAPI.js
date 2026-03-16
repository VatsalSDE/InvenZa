import axiosInstance from './axiosInstance';

/**
 * Profit & Loss API Service
 */
export const profitAPI = {
    getProfitSummary: async (startDate, endDate) => {
        const res = await axiosInstance.get(`/profit/summary?start_date=${startDate}&end_date=${endDate}`);
        return res.data;
    },

    getMonthlyTrend: async (startDate, endDate) => {
        const res = await axiosInstance.get(`/profit/monthly-trend?start_date=${startDate}&end_date=${endDate}`);
        return res.data;
    },

    getProductBreakdown: async (startDate, endDate) => {
        const res = await axiosInstance.get(`/profit/product-breakdown?start_date=${startDate}&end_date=${endDate}`);
        return res.data;
    },

    getDealerContribution: async (startDate, endDate) => {
        const res = await axiosInstance.get(`/profit/dealer-contribution?start_date=${startDate}&end_date=${endDate}`);
        return res.data;
    },

    getExpenses: async (startDate, endDate) => {
        const params = new URLSearchParams();
        if (startDate) params.append('start_date', startDate);
        if (endDate) params.append('end_date', endDate);
        const res = await axiosInstance.get(`/expenses?${params.toString()}`);
        return res.data;
    },

    addExpense: async (data) => {
        const res = await axiosInstance.post('/expenses', data);
        return res.data;
    },

    updateExpense: async (id, data) => {
        const res = await axiosInstance.put(`/expenses/${id}`, data);
        return res.data;
    },

    deleteExpense: async (id) => {
        const res = await axiosInstance.delete(`/expenses/${id}`);
        return res.data;
    },
};

export default profitAPI;
