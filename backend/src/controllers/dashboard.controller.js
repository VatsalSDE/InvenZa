import * as dashboardService from '../services/dashboard.service.js';
import { sendSuccess, sendError } from '../utils/responseHelper.js';

/**
 * Dashboard Controller
 * Handles dashboard statistics and analytics HTTP requests
 */

/**
 * Get comprehensive dashboard statistics
 * GET /api/dashboard/stats
 */
export const getStats = async (req, res, next) => {
  try {
    const stats = await dashboardService.getStats();
    return sendSuccess(res, stats);
  } catch (error) {
    if (error.statusCode) {
      return sendError(res, error.message, error.statusCode);
    }
    next(error);
  }
};

/**
 * Get sales data for charts
 * GET /api/dashboard/sales
 */
export const getSalesData = async (req, res, next) => {
  try {
    const period = req.query.period || 'month';
    const data = await dashboardService.getSalesData(period);
    return sendSuccess(res, data);
  } catch (error) {
    if (error.statusCode) {
      return sendError(res, error.message, error.statusCode);
    }
    next(error);
  }
};

/**
 * Get stock distribution data
 * GET /api/dashboard/stock-distribution
 */
export const getStockDistribution = async (req, res, next) => {
  try {
    const data = await dashboardService.getStockDistribution();
    return sendSuccess(res, data);
  } catch (error) {
    if (error.statusCode) {
      return sendError(res, error.message, error.statusCode);
    }
    next(error);
  }
};

/**
 * Get AI-powered business insights
 * GET /api/dashboard/insights
 */
export const getBusinessInsights = async (req, res, next) => {
  try {
    const insights = await dashboardService.getBusinessInsights();
    return sendSuccess(res, insights);
  } catch (error) {
    if (error.statusCode) {
      return sendError(res, error.message, error.statusCode);
    }
    next(error);
  }
};

export const getOrderPatterns = async (req, res, next) => {
  try {
    const data = await dashboardService.getOrderPatterns();
    return sendSuccess(res, data);
  } catch (error) {
    if (error.statusCode) {
      return sendError(res, error.message, error.statusCode);
    }
    next(error);
  }
};

export default {
  getStats,
  getSalesData,
  getStockDistribution,
  getBusinessInsights,
  getOrderPatterns,
};
