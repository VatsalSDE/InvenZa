import * as billingService from '../services/billing.service.js';
import { sendSuccess, sendError } from '../utils/responseHelper.js';

/**
 * Billing Controller
 * Handles billing-related HTTP requests
 */

/**
 * Get bill data for an order
 * GET /api/billing/order/:orderId
 */
export const getBillData = async (req, res, next) => {
  try {
    const data = await billingService.getBillData(req.params.orderId);
    return sendSuccess(res, data);
  } catch (error) {
    if (error.statusCode) {
      return sendError(res, error.message, error.statusCode);
    }
    next(error);
  }
};

/**
 * Generate bill preview (HTML)
 * GET /api/billing/preview/:orderId
 */
export const generateBillPreview = async (req, res, next) => {
  try {
    const preview = await billingService.generateBillPreview(req.params.orderId);
    return sendSuccess(res, preview);
  } catch (error) {
    if (error.statusCode) {
      return sendError(res, error.message, error.statusCode);
    }
    next(error);
  }
};

/**
 * Send bill via email
 * POST /api/billing/send-email
 */
export const sendBillEmail = async (req, res, next) => {
  try {
    const { order_id, dealer_email, bill_data } = req.body;

    if (!order_id) {
      return sendError(res, 'Order ID is required', 400);
    }

    const result = await billingService.sendBillEmail(order_id, dealer_email, bill_data);
    return sendSuccess(res, result, 200, result.message);
  } catch (error) {
    if (error.statusCode) {
      return sendError(res, error.message, error.statusCode);
    }
    next(error);
  }
};

/**
 * Download bill as HTML
 * GET /api/billing/download/:orderId
 */
export const downloadBill = async (req, res, next) => {
  try {
    const preview = await billingService.generateBillPreview(req.params.orderId);
    
    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Content-Disposition', `attachment; filename="bill-${preview.data.billNumber}.html"`);
    return res.send(preview.html);
  } catch (error) {
    if (error.statusCode) {
      return sendError(res, error.message, error.statusCode);
    }
    next(error);
  }
};

export default {
  getBillData,
  generateBillPreview,
  sendBillEmail,
  downloadBill,
};