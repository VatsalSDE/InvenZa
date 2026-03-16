import supplierPaymentsService from '../services/supplier_payments.service.js';
import { sendSuccess, sendError, sendCreated, sendNotFound } from '../utils/responseHelper.js';

/**
 * Supplier Payments Controller
 * Handles HTTP requests for supplier payments
 */

export const getAllSupplierPayments = async (req, res, next) => {
    try {
        const filters = {
            supplier_id: req.query.supplier_id,
        };

        const payments = await supplierPaymentsService.getAllSupplierPayments(filters);
        return sendSuccess(res, payments);
    } catch (error) {
        next(error);
    }
};

export const getSupplierPaymentById = async (req, res, next) => {
    try {
        const payment = await supplierPaymentsService.getSupplierPaymentById(req.params.id);
        return sendSuccess(res, payment);
    } catch (error) {
        next(error);
    }
};

export const getNextSupplierPaymentCode = async (req, res, next) => {
    try {
        const code = await supplierPaymentsService.generateNextSupplierPaymentCode();
        return sendSuccess(res, { transaction_id: code });
    } catch (error) {
        next(error);
    }
};

export const createSupplierPayment = async (req, res, next) => {
    try {
        const payment = await supplierPaymentsService.createSupplierPayment(req.body);
        return sendCreated(res, payment, 'Supplier payment created successfully');
    } catch (error) {
        next(error);
    }
};

export const updateSupplierPayment = async (req, res, next) => {
    try {
        const payment = await supplierPaymentsService.updateSupplierPayment(req.params.id, req.body);
        return sendSuccess(res, payment, 'Supplier payment updated successfully');
    } catch (error) {
        next(error);
    }
};

export const deleteSupplierPayment = async (req, res, next) => {
    try {
        await supplierPaymentsService.deleteSupplierPayment(req.params.id);
        return sendSuccess(res, null, 'Supplier payment deleted successfully');
    } catch (error) {
        next(error);
    }
};

export const getSupplierPaymentsByPurchase = async (req, res, next) => {
    try {
        const payments = await supplierPaymentsService.getSupplierPaymentsByPurchase(req.params.purchaseId);
        return sendSuccess(res, payments);
    } catch (error) {
        next(error);
    }
};

export const getSupplierPaymentsBySupplier = async (req, res, next) => {
    try {
        const payments = await supplierPaymentsService.getAllSupplierPayments({ supplier_id: req.params.supplierId });
        return sendSuccess(res, payments);
    } catch (error) {
        next(error);
    }
};
