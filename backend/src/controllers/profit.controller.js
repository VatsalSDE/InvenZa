import * as profitService from '../services/profit.service.js';
import { sendSuccess, sendError } from '../utils/responseHelper.js';

/**
 * Profit Controller
 * Handles P&L HTTP requests
 */

export const getSummary = async (req, res, next) => {
    try {
        const { start_date, end_date } = req.query;
        if (!start_date || !end_date) {
            return sendError(res, 'start_date and end_date are required', 400);
        }
        const data = await profitService.getProfitSummary(start_date, end_date);
        return sendSuccess(res, data);
    } catch (error) {
        if (error.statusCode) return sendError(res, error.message, error.statusCode);
        next(error);
    }
};

export const getMonthlyTrend = async (req, res, next) => {
    try {
        const { start_date, end_date } = req.query;
        if (!start_date || !end_date) {
            return sendError(res, 'start_date and end_date are required', 400);
        }
        const data = await profitService.getMonthlyTrend(start_date, end_date);
        return sendSuccess(res, data);
    } catch (error) {
        if (error.statusCode) return sendError(res, error.message, error.statusCode);
        next(error);
    }
};

export const getProductBreakdown = async (req, res, next) => {
    try {
        const { start_date, end_date } = req.query;
        if (!start_date || !end_date) {
            return sendError(res, 'start_date and end_date are required', 400);
        }
        const data = await profitService.getProductBreakdown(start_date, end_date);
        return sendSuccess(res, data);
    } catch (error) {
        if (error.statusCode) return sendError(res, error.message, error.statusCode);
        next(error);
    }
};

export const getDealerContribution = async (req, res, next) => {
    try {
        const { start_date, end_date } = req.query;
        if (!start_date || !end_date) {
            return sendError(res, 'start_date and end_date are required', 400);
        }
        const data = await profitService.getDealerContribution(start_date, end_date);
        return sendSuccess(res, data);
    } catch (error) {
        if (error.statusCode) return sendError(res, error.message, error.statusCode);
        next(error);
    }
};

export default { getSummary, getMonthlyTrend, getProductBreakdown, getDealerContribution };
