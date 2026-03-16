import * as dealersService from '../services/dealers.service.js';
import { sendSuccess, sendCreated, sendNoContent, sendError } from '../utils/responseHelper.js';

/**
 * Dealers Controller
 * Handles dealer-related HTTP requests
 */

/**
 * Get all dealers
 * GET /api/dealers
 */
export const getAllDealers = async (req, res, next) => {
  try {
    const filters = {
      search: req.query.search,
    };
    const dealers = await dealersService.getAllDealers(filters);
    return sendSuccess(res, dealers);
  } catch (error) {
    if (error.statusCode) {
      return sendError(res, error.message, error.statusCode);
    }
    next(error);
  }
};

/**
 * Get dealer by ID
 * GET /api/dealers/:id
 */
export const getDealerById = async (req, res, next) => {
  try {
    const dealer = await dealersService.getDealerById(req.params.id);
    return sendSuccess(res, dealer);
  } catch (error) {
    if (error.statusCode) {
      return sendError(res, error.message, error.statusCode);
    }
    next(error);
  }
};

/**
 * Create a new dealer
 * POST /api/dealers
 */
export const createDealer = async (req, res, next) => {
  try {
    const dealer = await dealersService.createDealer(req.body);
    return sendCreated(res, dealer, 'Dealer created successfully');
  } catch (error) {
    if (error.statusCode) {
      return sendError(res, error.message, error.statusCode);
    }
    next(error);
  }
};

/**
 * Update a dealer
 * PUT /api/dealers/:id
 */
export const updateDealer = async (req, res, next) => {
  try {
    const dealer = await dealersService.updateDealer(req.params.id, req.body);
    return sendSuccess(res, dealer, 200, 'Dealer updated successfully');
  } catch (error) {
    if (error.statusCode) {
      return sendError(res, error.message, error.statusCode);
    }
    next(error);
  }
};

/**
 * Delete a dealer
 * DELETE /api/dealers/:id
 */
export const deleteDealer = async (req, res, next) => {
  try {
    await dealersService.deleteDealer(req.params.id);
    return sendNoContent(res);
  } catch (error) {
    if (error.statusCode) {
      return sendError(res, error.message, error.statusCode);
    }
    next(error);
  }
};

/**
 * Get dealer ledger (orders, payments, balance)
 * GET /api/dealers/:id/ledger
 */
export const getDealerLedger = async (req, res, next) => {
  try {
    const ledger = await dealersService.getDealerLedger(req.params.id);
    return sendSuccess(res, ledger);
  } catch (error) {
    if (error.statusCode) {
      return sendError(res, error.message, error.statusCode);
    }
    next(error);
  }
};

/**
 * Get outstanding balances for all dealers
 * GET /api/dealers/outstanding
 */
export const getOutstandingBalances = async (req, res, next) => {
  try {
    const balances = await dealersService.getOutstandingBalances();
    return sendSuccess(res, balances);
  } catch (error) {
    if (error.statusCode) {
      return sendError(res, error.message, error.statusCode);
    }
    next(error);
  }
};

/**
 * Get dealer payment behavior scores
 * GET /api/dealers/payment-scores
 */
export const getPaymentScores = async (req, res, next) => {
  try {
    const scores = await dealersService.getPaymentScores();
    return sendSuccess(res, scores);
  } catch (error) {
    if (error.statusCode) {
      return sendError(res, error.message, error.statusCode);
    }
    next(error);
  }
};

/**
 * Get top purchased products for a dealer
 * GET /api/dealers/:id/top-products
 */
export const getDealerTopProducts = async (req, res, next) => {
  try {
    const products = await dealersService.getDealerTopProducts(req.params.id);
    return sendSuccess(res, products);
  } catch (error) {
    if (error.statusCode) {
      return sendError(res, error.message, error.statusCode);
    }
    next(error);
  }
};

export default {
  getAllDealers,
  getDealerById,
  createDealer,
  updateDealer,
  deleteDealer,
  getDealerLedger,
  getOutstandingBalances,
  getPaymentScores,
  getDealerTopProducts,
};
