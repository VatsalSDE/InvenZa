import axiosInstance from './axiosInstance';

export const supplierPaymentsAPI = {
    // Get all supplier payments
    getAll: async (filters = {}) => {
        const params = new URLSearchParams();
        if (filters.supplier_id) params.append('supplier_id', filters.supplier_id);

        const response = await axiosInstance.get(`/supplier-payments?${params.toString()}`);
        return response.data.data;
    },

    // Get a specific supplier payment
    getById: async (id) => {
        const response = await axiosInstance.get(`/supplier-payments/${id}`);
        return response.data.data;
    },

    // Record a new supplier payment
    create: async (data) => {
        const response = await axiosInstance.post('/supplier-payments', data);
        return response.data.data;
    },

    // Update a supplier payment
    update: async (id, data) => {
        const response = await axiosInstance.put(`/supplier-payments/${id}`, data);
        return response.data.data;
    },

    // Delete a supplier payment
    delete: async (id) => {
        const response = await axiosInstance.delete(`/supplier-payments/${id}`);
        return response.data.data;
    },

    // Get payments by purchase ID
    getByPurchase: async (purchaseId) => {
        const response = await axiosInstance.get(`/supplier-payments/purchase/${purchaseId}`);
        return response.data.data;
    }
};
