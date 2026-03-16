import * as suppliersService from '../services/suppliers.service.js';
import * as purchasesService from '../services/purchases.service.js';
import { sendSuccess, sendCreated, sendNoContent, sendError } from '../utils/responseHelper.js';

/**
 * Suppliers Controller
 * Handles supplier-related HTTP requests
 */

/**
 * Get all non-archived suppliers
 * GET /api/suppliers
 */
export const getAllSuppliers = async (req, res, next) => {
  try {
    const filters = {
      search: req.query.search,
    };
    const suppliers = await suppliersService.getAllSuppliers(filters);
    return sendSuccess(res, suppliers);
  } catch (error) {
    if (error.statusCode) {
      return sendError(res, error.message, error.statusCode);
    }
    next(error);
  }
};

/**
 * Get active suppliers for dropdowns
 * GET /api/suppliers/active
 */
export const getActiveSuppliers = async (req, res, next) => {
  try {
    const suppliers = await suppliersService.getActiveSuppliers();
    return sendSuccess(res, suppliers);
  } catch (error) {
    if (error.statusCode) {
      return sendError(res, error.message, error.statusCode);
    }
    next(error);
  }
};

/**
 * Get supplier by ID
 * GET /api/suppliers/:id
 */
export const getSupplierById = async (req, res, next) => {
  try {
    const supplier = await suppliersService.getSupplierById(req.params.id);
    return sendSuccess(res, supplier);
  } catch (error) {
    if (error.statusCode) {
      return sendError(res, error.message, error.statusCode);
    }
    next(error);
  }
};

/**
 * Create a new supplier
 * POST /api/suppliers
 */
export const createSupplier = async (req, res, next) => {
  try {
    const supplier = await suppliersService.createSupplier(req.body);
    return sendCreated(res, supplier, 'Supplier created successfully');
  } catch (error) {
    if (error.statusCode) {
      return sendError(res, error.message, error.statusCode);
    }
    next(error);
  }
};

/**
 * Update a supplier
 * PUT /api/suppliers/:id
 */
export const updateSupplier = async (req, res, next) => {
  try {
    const supplier = await suppliersService.updateSupplier(req.params.id, req.body);
    return sendSuccess(res, supplier, 200, 'Supplier updated successfully');
  } catch (error) {
    if (error.statusCode) {
      return sendError(res, error.message, error.statusCode);
    }
    next(error);
  }
};

/**
 * Soft delete a supplier (archive)
 * DELETE /api/suppliers/:id
 */
export const deleteSupplier = async (req, res, next) => {
  try {
    await suppliersService.deleteSupplier(req.params.id);
    return sendNoContent(res);
  } catch (error) {
    if (error.statusCode) {
      return sendError(res, error.message, error.statusCode);
    }
    next(error);
  }
};

/**
 * Restore an archived supplier
 * POST /api/suppliers/:id/restore
 */
export const restoreSupplier = async (req, res, next) => {
  try {
    const supplier = await suppliersService.restoreSupplier(req.params.id);
    return sendSuccess(res, supplier, 200, 'Supplier restored successfully');
  } catch (error) {
    if (error.statusCode) {
      return sendError(res, error.message, error.statusCode);
    }
    next(error);
  }
};

/**
 * Get archived suppliers
 * GET /api/suppliers/archived
 */
export const getArchivedSuppliers = async (req, res, next) => {
  try {
    const suppliers = await suppliersService.getArchivedSuppliers();
    return sendSuccess(res, suppliers);
  } catch (error) {
    if (error.statusCode) {
      return sendError(res, error.message, error.statusCode);
    }
    next(error);
  }
};

/**
 * Get supplier ledger (purchase history)
 * GET /api/suppliers/:id/ledger
 */
export const getSupplierLedger = async (req, res, next) => {
  try {
    const { id } = req.params;
    const purchases = await purchasesService.getPurchasesBySupplier(id);
    return sendSuccess(res, purchases);
  } catch (error) {
    if (error.statusCode) {
      return sendError(res, error.message, error.statusCode);
    }
    next(error);
  }
};

/**
 * Get supplier models (auto-mapped)
 * GET /api/suppliers/:id/models
 */
export const getSupplierModels = async (req, res, next) => {
  try {
    const { id } = req.params;
    const models = await suppliersService.getSupplierModels(id);
    return sendSuccess(res, models);
  } catch (error) {
    if (error.statusCode) {
      return sendError(res, error.message, error.statusCode);
    }
    next(error);
  }
};

export default {
  getAllSuppliers,
  getActiveSuppliers,
  getSupplierById,
  createSupplier,
  updateSupplier,
  deleteSupplier,
  restoreSupplier,
  getArchivedSuppliers,
  getSupplierLedger,
  getSupplierModels,
};
