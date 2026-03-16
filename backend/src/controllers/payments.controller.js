import * as paymentsService from '../services/payments.service.js';
import { sendSuccess, sendCreated, sendNoContent, sendError } from '../utils/responseHelper.js';

/**
 * Payments Controller
 * Handles payment-related HTTP requests
 */

/**
 * Get all payments
 * GET /api/payments
 */
export const getAllPayments = async (req, res, next) => {
  try {
    const filters = {
      status: req.query.status,
      dealer_id: req.query.dealer_id,
    };
    const payments = await paymentsService.getAllPayments(filters);
    return sendSuccess(res, payments);
  } catch (error) {
    if (error.statusCode) {
      return sendError(res, error.message, error.statusCode);
    }
    next(error);
  }
};

/**
 * Get payment by ID
 * GET /api/payments/:id
 */
export const getPaymentById = async (req, res, next) => {
  try {
    const payment = await paymentsService.getPaymentById(req.params.id);
    return sendSuccess(res, payment);
  } catch (error) {
    if (error.statusCode) {
      return sendError(res, error.message, error.statusCode);
    }
    next(error);
  }
};

/**
 * Create a new payment
 * POST /api/payments
 */
export const createPayment = async (req, res, next) => {
  try {
    const payment = await paymentsService.createPayment(req.body);
    return sendCreated(res, payment, 'Payment recorded successfully');
  } catch (error) {
    if (error.statusCode) {
      return sendError(res, error.message, error.statusCode, error.errors);
    }
    next(error);
  }
};

/**
 * Update a payment
 * PUT /api/payments/:id
 */
export const updatePayment = async (req, res, next) => {
  try {
    const payment = await paymentsService.updatePayment(req.params.id, req.body);
    return sendSuccess(res, payment, 200, 'Payment updated successfully');
  } catch (error) {
    if (error.statusCode) {
      return sendError(res, error.message, error.statusCode);
    }
    next(error);
  }
};

/**
 * Delete a payment
 * DELETE /api/payments/:id
 */
export const deletePayment = async (req, res, next) => {
  try {
    await paymentsService.deletePayment(req.params.id);
    return sendNoContent(res);
  } catch (error) {
    if (error.statusCode) {
      return sendError(res, error.message, error.statusCode);
    }
    next(error);
  }
};

/**
 * Get payments for an order
 * GET /api/payments/order/:orderId
 */
export const getPaymentsByOrder = async (req, res, next) => {
  try {
    const payments = await paymentsService.getPaymentsByOrder(req.params.orderId);
    return sendSuccess(res, payments);
  } catch (error) {
    if (error.statusCode) {
      return sendError(res, error.message, error.statusCode);
    }
    next(error);
  }
};

/**
 * Generate next payment code
 * GET /api/payments/next-code
 */
export const getNextPaymentCode = async (req, res, next) => {
  try {
    const code = await paymentsService.generateNextPaymentCode();
    return sendSuccess(res, { code });
  } catch (error) {
    if (error.statusCode) {
      return sendError(res, error.message, error.statusCode);
    }
    next(error);
  }
};

export default {
  getAllPayments,
  getPaymentById,
  createPayment,
  updatePayment,
  deletePayment,
  getPaymentsByOrder,
  getNextPaymentCode,
};
