import * as purchasesService from '../services/purchases.service.js';
import { sendSuccess, sendCreated, sendNoContent, sendError } from '../utils/responseHelper.js';

/**
 * Purchases Controller
 * Handles purchase order related HTTP requests
 */

/**
 * Get all purchases
 * GET /api/purchases
 */
export const getAllPurchases = async (req, res, next) => {
  try {
    const filters = {
      status: req.query.status,
      supplier_id: req.query.supplier_id,
    };
    const purchases = await purchasesService.getAllPurchases(filters);
    return sendSuccess(res, purchases);
  } catch (error) {
    if (error.statusCode) {
      return sendError(res, error.message, error.statusCode);
    }
    next(error);
  }
};

/**
 * Get purchase by ID
 * GET /api/purchases/:id
 */
export const getPurchaseById = async (req, res, next) => {
  try {
    const purchase = await purchasesService.getPurchaseById(req.params.id);
    return sendSuccess(res, purchase);
  } catch (error) {
    if (error.statusCode) {
      return sendError(res, error.message, error.statusCode);
    }
    next(error);
  }
};

/**
 * Get purchase items
 * GET /api/purchases/:id/items
 */
export const getPurchaseItems = async (req, res, next) => {
  try {
    const items = await purchasesService.getPurchaseItems(req.params.id);
    return sendSuccess(res, items);
  } catch (error) {
    if (error.statusCode) {
      return sendError(res, error.message, error.statusCode);
    }
    next(error);
  }
};

/**
 * Create a new purchase
 * POST /api/purchases
 */
export const createPurchase = async (req, res, next) => {
  try {
    const purchase = await purchasesService.createPurchase(req.body);
    return sendCreated(res, purchase, 'Purchase order created successfully');
  } catch (error) {
    if (error.statusCode) {
      return sendError(res, error.message, error.statusCode);
    }
    next(error);
  }
};

/**
 * Update a purchase
 * PUT /api/purchases/:id
 */
export const updatePurchase = async (req, res, next) => {
  try {
    const purchase = await purchasesService.updatePurchase(req.params.id, req.body);
    return sendSuccess(res, purchase, 200, 'Purchase order updated successfully');
  } catch (error) {
    if (error.statusCode) {
      return sendError(res, error.message, error.statusCode);
    }
    next(error);
  }
};

/**
 * Update purchase status (triggers stock increase if Received)
 * PUT /api/purchases/:id/status
 */
export const updatePurchaseStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const purchase = await purchasesService.updatePurchaseStatus(req.params.id, status);
    return sendSuccess(res, purchase, 200, 'Purchase status updated');
  } catch (error) {
    if (error.statusCode) {
      return sendError(res, error.message, error.statusCode);
    }
    next(error);
  }
};

/**
 * Delete a purchase
 * DELETE /api/purchases/:id
 */
export const deletePurchase = async (req, res, next) => {
  try {
    await purchasesService.deletePurchase(req.params.id);
    return sendNoContent(res);
  } catch (error) {
    if (error.statusCode) {
      return sendError(res, error.message, error.statusCode);
    }
    next(error);
  }
};

/**
 * Get next purchase code
 * GET /api/purchases/next-code
 */
export const getNextPurchaseCode = async (req, res, next) => {
  try {
    const code = await purchasesService.generateNextPurchaseCode();
    return sendSuccess(res, { code });
  } catch (error) {
    if (error.statusCode) {
      return sendError(res, error.message, error.statusCode);
    }
    next(error);
  }
};

/**
 * Get purchases by supplier
 * GET /api/purchases/supplier/:supplierId
 */
export const getPurchasesBySupplier = async (req, res, next) => {
  try {
    const purchases = await purchasesService.getPurchasesBySupplier(req.params.supplierId);
    return sendSuccess(res, purchases);
  } catch (error) {
    if (error.statusCode) {
      return sendError(res, error.message, error.statusCode);
    }
    next(error);
  }
};

export default {
  getAllPurchases,
  getPurchaseById,
  getPurchaseItems,
  createPurchase,
  updatePurchase,
  updatePurchaseStatus,
  deletePurchase,
  getNextPurchaseCode,
  getPurchasesBySupplier,
};
